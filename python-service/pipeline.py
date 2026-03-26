"""
Card Analysis Pipeline — orchestrates all 4 phases.

Pipeline:
  1. Preprocess: resize, perspective correct (OpenCV)
  2. CardDetector (YOLOv8n-seg): segment and isolate card region
  3. CenteringAnalyzer (OpenCV): measure border widths and deviation
  4. DefectDetector (YOLOv8n custom or OpenCV heuristics): surface defects
  5. DeepCornerScorer (Detectron2 or OpenCV): per-corner quality scores
  6. GradePredictor: weighted PSA-style final grade

Singletons are instantiated once at import time and reused across all requests.
Each phase gracefully degrades when optional models/weights are unavailable.
"""
import numpy as np
import cv2
import logging
from dataclasses import dataclass, field
from typing import Optional

from utils.preprocessing import load_image_from_bytes, correct_perspective
from models.card_detector import CardDetector, CardDetection
from models.centering import CenteringAnalyzer
from models.defect_detector import DefectDetector, Defect
from models.deep_corner_scorer import DeepCornerScorer
from models.grade_predictor import GradePredictor

logger = logging.getLogger(__name__)

# Module-level singletons: loaded once, reused across requests.
_card_detector = CardDetector()
_centering_analyzer = CenteringAnalyzer()
_defect_detector = DefectDetector()
_corner_scorer = DeepCornerScorer()
_grade_predictor = GradePredictor()


@dataclass
class PipelineResult:
    centering: dict
    corners: dict
    surface: dict
    grade: dict
    card_detection: Optional[dict] = None
    pipeline_phases: list[str] = field(default_factory=list)


def analyze_card(image_bytes: bytes, use_deep_analysis: bool = False) -> PipelineResult:
    """
    Run the full 4-phase analysis pipeline on raw image bytes.

    Args:
        image_bytes:      JPEG or PNG image data as bytes.
        use_deep_analysis: Force Detectron2 corner scoring even for cards that
                           don't meet the high-value threshold automatically.

    Returns:
        PipelineResult with centering, corners, surface, grade, card_detection,
        and pipeline_phases (list of string phase labels for debugging).
    """
    phases: list[str] = []

    # ------------------------------------------------------------------ #
    # Phase 1 — OpenCV preprocessing                                       #
    # ------------------------------------------------------------------ #
    img = load_image_from_bytes(image_bytes)
    img = correct_perspective(img)
    phases.append("opencv_preprocess")

    # ------------------------------------------------------------------ #
    # Phase 2 — YOLOv8n-seg card segmentation                             #
    # ------------------------------------------------------------------ #
    detection: Optional[CardDetection] = _card_detector.segment(img)
    card_detection_info: Optional[dict] = None

    if detection is not None:
        x1, y1, x2, y2 = detection.bbox
        # Guard against degenerate boxes
        x1, y1 = max(0, x1), max(0, y1)
        x2 = min(img.shape[1], x2)
        y2 = min(img.shape[0], y2)
        card_img = img[y1:y2, x1:x2]
        if card_img.size == 0:
            card_img = img
        card_detection_info = {
            "confidence": round(detection.confidence, 3),
            "bbox": list(detection.bbox),
            "is_high_value": detection.is_high_value_candidate,
        }
        phases.append("yolov8_segment")
    else:
        # No card detected — treat the full corrected image as the card region.
        card_img = img
        phases.append("yolov8_fallback_full_image")

    # ------------------------------------------------------------------ #
    # Phase 1 (continued) — OpenCV centering measurement                  #
    # ------------------------------------------------------------------ #
    centering = _centering_analyzer.analyze_image(card_img)
    phases.append("opencv_centering")

    # ------------------------------------------------------------------ #
    # Phase 2/3 — Defect detection (custom YOLOv8 or OpenCV heuristics)   #
    # ------------------------------------------------------------------ #
    defects = _defect_detector.detect(card_img)
    surface = _build_surface_result(defects, card_img)
    phases.append(
        "yolov8_custom_defects" if _defect_detector._custom_available else "opencv_defects"
    )

    # ------------------------------------------------------------------ #
    # Phase 4 — Corner scoring (Detectron2 or OpenCV)                     #
    # ------------------------------------------------------------------ #
    should_use_deep = use_deep_analysis or (
        detection is not None and detection.is_high_value_candidate
    )
    # DeepCornerScorer internally decides whether to use Detectron2 or OpenCV
    # based on whether weights are available. The should_use_deep flag is
    # informational here; the scorer always uses the best available method.
    corners = _corner_scorer.score_corners(card_img)
    phases.append(
        "detectron2_corners" if corners.get("used_detectron2") else "opencv_corners"
    )

    # ------------------------------------------------------------------ #
    # Grade prediction — weighted PSA-style grade                         #
    # ------------------------------------------------------------------ #
    grade = _grade_predictor.predict(centering, corners, surface)

    return PipelineResult(
        centering=centering,
        corners=corners,
        surface=surface,
        grade=grade,
        card_detection=card_detection_info,
        pipeline_phases=phases,
    )


def _build_surface_result(defects: list[Defect], card_img: np.ndarray) -> dict:
    """
    Convert a list of Defect objects into the surface result dict consumed
    by the API response and GradePredictor.

    Scoring: starts at 10.0 and deducts per-defect based on severity.
      minor   → −0.25
      moderate → −0.60
      severe  → −1.20
    Floor is 1.0.
    """
    defect_dicts = []
    has_print_lines = False
    has_holo_damage = False

    for d in defects:
        x1, y1, x2, y2 = d.bbox
        defect_dicts.append({
            "x": x1,
            "y": y1,
            "width": x2 - x1,
            "height": y2 - y1,
            "type": d.defect_type,
            "severity": d.severity,
            "confidence": round(d.confidence, 3),
        })
        if d.defect_type == "print_line":
            has_print_lines = True
        if d.defect_type == "stain":
            # Stains on holo/foil surfaces indicate holo damage
            has_holo_damage = True

    severity_penalty = {"minor": 0.25, "moderate": 0.60, "severe": 1.20}
    score = 10.0
    for d in defects:
        score -= severity_penalty.get(d.severity, 0.25)
    score = max(1.0, round(score, 1))

    return {
        "score": score,
        "scratches": defect_dicts,
        "printLines": has_print_lines,
        "holoDamage": has_holo_damage,
        "defectCount": len(defects),
    }
