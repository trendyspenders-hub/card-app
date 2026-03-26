"""
Sports Card Grader — FastAPI ML Service

Endpoints:
  POST /analyze/centering  — OpenCV centering only (fast)
  POST /analyze/corners    — Corner scoring (Detectron2 if available)
  POST /analyze/surface    — Defect detection (YOLOv8 or OpenCV fallback)
  POST /analyze/condition  — Full grade prediction
  POST /analyze/complete   — All analyses in one call (recommended)
  GET  /health             — Service health + loaded model info
"""
import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Pipeline (singletons load on first request, not on import)
from pipeline import analyze_card, _build_surface_result
from models.centering import CenteringAnalyzer
from models.deep_corner_scorer import DeepCornerScorer
from models.defect_detector import DefectDetector
from models.grade_predictor import GradePredictor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# Lazy singletons for individual endpoints
_centering = CenteringAnalyzer()
_corners = DeepCornerScorer()
_defects = DefectDetector()
_grader = GradePredictor()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CardGrade ML service v2 starting up...")
    yield
    logger.info("CardGrade ML service shutting down.")


app = FastAPI(
    title="Card Grader ML Service",
    description="4-phase computer vision pipeline for sports card grading analysis",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def _read_image(file: UploadFile) -> bytes:
    """Validate and read uploaded image file. Raises HTTPException on bad input."""
    allowed = {"image/jpeg", "image/jpg", "image/png", "image/webp"}
    if file.content_type and file.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WebP.",
        )
    data = await file.read()
    if len(data) == 0:
        raise HTTPException(status_code=400, detail="Empty file received.")
    if len(data) > 20 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large (max 20 MB).")
    return data


@app.post("/analyze/centering")
async def analyze_centering(file: UploadFile = File(...)):
    """
    OpenCV centering analysis only.
    Returns border measurements (px + %) and centering score 1–10.
    """
    data = await _read_image(file)
    start = time.perf_counter()
    try:
        from utils.preprocessing import load_image_from_bytes, correct_perspective
        img = correct_perspective(load_image_from_bytes(data))
        result = _centering.analyze_image(img)
        elapsed = time.perf_counter() - start
        logger.info("Centering analysis complete in %.3fs — score: %s", elapsed, result.get("score"))
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Centering analysis error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/analyze/corners")
async def analyze_corners(file: UploadFile = File(...)):
    """
    Corner scoring endpoint.
    Uses Detectron2 if weights are present, OpenCV otherwise.
    Returns frontLeft, frontRight, backLeft, backRight, overall scores (1–10).
    """
    data = await _read_image(file)
    start = time.perf_counter()
    try:
        from utils.preprocessing import load_image_from_bytes, correct_perspective
        img = correct_perspective(load_image_from_bytes(data))
        result = _corners.score_corners(img)
        elapsed = time.perf_counter() - start
        logger.info(
            "Corner scoring complete in %.3fs — overall: %s (detectron2=%s)",
            elapsed, result.get("overall"), result.get("used_detectron2"),
        )
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Corner analysis error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/analyze/surface")
async def analyze_surface(file: UploadFile = File(...)):
    """
    Surface defect detection endpoint.
    Uses custom YOLOv8 weights if available, OpenCV heuristics otherwise.
    Returns score, scratch list, printLines, holoDamage, defectCount.
    """
    data = await _read_image(file)
    start = time.perf_counter()
    try:
        from utils.preprocessing import load_image_from_bytes, correct_perspective
        img = correct_perspective(load_image_from_bytes(data))
        defects = _defects.detect(img)
        result = _build_surface_result(defects, img)
        elapsed = time.perf_counter() - start
        logger.info(
            "Surface analysis complete in %.3fs — score: %s, defects: %d",
            elapsed, result.get("score"), result.get("defectCount", 0),
        )
        return JSONResponse(content=result)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Surface analysis error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/analyze/condition")
async def analyze_condition(file: UploadFile = File(...)):
    """
    Full grade prediction. Runs the complete 4-phase pipeline and returns
    only the grade breakdown (predictedGrade, confidence, breakdown).
    """
    data = await _read_image(file)
    start = time.perf_counter()
    try:
        result = analyze_card(data)
        elapsed = time.perf_counter() - start
        logger.info(
            "Condition analysis complete in %.3fs — grade: %s, confidence: %s",
            elapsed,
            result.grade.get("predictedGrade"),
            result.grade.get("confidence"),
        )
        return JSONResponse(content=result.grade)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Grade analysis error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/analyze/complete")
async def analyze_complete(file: UploadFile = File(...)):
    """
    Recommended endpoint. Runs the full 4-phase pipeline once and returns all
    analysis results together with card detection metadata and phase labels.

    Response shape:
      centering    — border measurements and centering score
      corners      — per-corner scores and overall
      surface      — defect list, surface score, printLines, holoDamage
      grade        — predictedGrade, confidence, breakdown
      cardDetection — YOLOv8 detection metadata (confidence, bbox, is_high_value)
      pipelinePhases — list of phase strings executed (useful for debugging)
    """
    data = await _read_image(file)
    start = time.perf_counter()
    try:
        result = analyze_card(data)
        elapsed = time.perf_counter() - start
        logger.info(
            "Complete pipeline finished in %.3fs — grade: %s, phases: %s",
            elapsed,
            result.grade.get("predictedGrade"),
            result.pipeline_phases,
        )
        return JSONResponse(content={
            "centering": result.centering,
            "corners": result.corners,
            "surface": result.surface,
            "grade": result.grade,
            "cardDetection": result.card_detection,
            "pipelinePhases": result.pipeline_phases,
        })
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Complete pipeline error: %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/health")
def health():
    """
    Service health check. Reports which optional model phases are active.
    YOLOv8 base models auto-download on first request so they always report
    'auto-download on first use' until that first request completes.
    """
    phase_list = ["opencv", "yolov8"]
    if _defects._custom_available:
        phase_list.append("custom_yolov8")
    if _corners._available:
        phase_list.append("detectron2")

    return {
        "status": "healthy",
        "service": "cardgrade-ml",
        "version": "2.0.0",
        "models": {
            "yolov8_detection": "auto-download on first use (yolov8n.pt)",
            "yolov8_segmentation": "auto-download on first use (yolov8n-seg.pt)",
            "custom_defect_model": str(_defects._custom_available),
            "detectron2_corners": str(_corners._available),
        },
        "phases_available": phase_list,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
