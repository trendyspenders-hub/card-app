"""
Phase 2: YOLOv8n-seg for general defect detection.
Phase 3: Custom fine-tuned YOLOv8 for card-specific defects.

Defect classes (custom model, trained on card imagery):
  0: crease       - hard fold lines
  1: dimple       - surface dents
  2: scratch      - surface abrasion
  3: print_line   - manufacturing line artifact
  4: stain        - surface discoloration
  5: corner_wear  - corner rounding/fraying

Falls back to Phase 2 OpenCV heuristics if custom model not loaded.
"""
from ultralytics import YOLO
import numpy as np
import cv2
from dataclasses import dataclass, field
from typing import Optional
from pathlib import Path

DEFECT_CLASSES = {
    0: "crease",
    1: "dimple",
    2: "scratch",
    3: "print_line",
    4: "stain",
    5: "corner_wear",
}

SEVERITY_THRESHOLDS = {
    "crease":      {"minor": 0.3, "moderate": 0.5, "severe": 0.7},
    "dimple":      {"minor": 0.2, "moderate": 0.4, "severe": 0.6},
    "scratch":     {"minor": 0.25, "moderate": 0.45, "severe": 0.65},
    "print_line":  {"minor": 0.2, "moderate": 0.35, "severe": 0.5},
    "stain":       {"minor": 0.3, "moderate": 0.5, "severe": 0.7},
    "corner_wear": {"minor": 0.25, "moderate": 0.45, "severe": 0.65},
}


@dataclass
class Defect:
    defect_type: str
    severity: str                         # 'minor', 'moderate', 'severe'
    confidence: float
    bbox: tuple[int, int, int, int]       # x1, y1, x2, y2 (relative to card crop)
    mask: Optional[np.ndarray] = field(default=None, repr=False)


class DefectDetector:
    """
    Two-tier defect detection:
      Tier 1 (always runs): YOLOv8n-seg general segmentation fallback via OpenCV heuristics
      Tier 2 (if custom weights exist): fine-tuned card defect model (Phase 3)

    Custom weights path: python-service/weights/card_defects_v1.pt
    If that file is not present, detection falls back to OpenCV-based scratch and
    print-line heuristics from utils.image_processing.
    """

    CUSTOM_WEIGHTS = Path(__file__).parent.parent / "weights" / "card_defects_v1.pt"

    def __init__(self):
        self._seg_model: Optional[YOLO] = None
        self._custom_model: Optional[YOLO] = None
        self._custom_available: bool = self.CUSTOM_WEIGHTS.exists()

    def _load_seg(self) -> YOLO:
        if self._seg_model is None:
            self._seg_model = YOLO("yolov8n-seg.pt")
        return self._seg_model

    def _load_custom(self) -> Optional[YOLO]:
        if self._custom_model is None and self._custom_available:
            self._custom_model = YOLO(str(self.CUSTOM_WEIGHTS))
        return self._custom_model

    def _severity_from_conf(self, defect_type: str, conf: float) -> str:
        """Map confidence value to severity label using per-class thresholds."""
        thresholds = SEVERITY_THRESHOLDS.get(
            defect_type, {"minor": 0.3, "moderate": 0.5, "severe": 0.7}
        )
        if conf >= thresholds["severe"]:
            return "severe"
        if conf >= thresholds["moderate"]:
            return "moderate"
        return "minor"

    def detect(self, card_img: np.ndarray) -> list[Defect]:
        """
        Run defect detection on an already-cropped card image.

        Phase 3 path (custom weights present):
          Runs fine-tuned YOLOv8 with card-specific defect classes.
          Each detection box is mapped to a Defect dataclass with optional mask.

        Phase 2 fallback (no custom weights):
          Applies OpenCV heuristics (detect_scratches, detect_print_lines)
          from utils.image_processing to approximate defect locations.
        """
        defects: list[Defect] = []

        # --- Phase 3: custom card-specific model ---
        if self._custom_available:
            model = self._load_custom()
            results = model(card_img, verbose=False, conf=0.2)[0]
            if results.boxes is not None:
                for i, box in enumerate(results.boxes):
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    defect_type = DEFECT_CLASSES.get(cls_id, "unknown")
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    mask = None
                    if results.masks is not None and i < len(results.masks):
                        raw = results.masks.data[i].cpu().numpy()
                        resized = cv2.resize(raw, (card_img.shape[1], card_img.shape[0]))
                        mask = (resized > 0.5).astype(np.uint8) * 255
                    defects.append(Defect(
                        defect_type=defect_type,
                        severity=self._severity_from_conf(defect_type, conf),
                        confidence=conf,
                        bbox=(x1, y1, x2, y2),
                        mask=mask,
                    ))
            return defects

        # --- Phase 2 fallback: OpenCV heuristics ---
        from utils.image_processing import detect_scratches, detect_print_lines

        scratch_regions = detect_scratches(card_img)
        for r in scratch_regions:
            conf = 0.7 if r.get("severity") == "severe" else (0.5 if r.get("severity") == "moderate" else 0.35)
            defects.append(Defect(
                defect_type="scratch",
                severity=r.get("severity", "minor"),
                confidence=conf,
                bbox=(r["x"], r["y"], r["x"] + r["width"], r["y"] + r["height"]),
            ))

        if detect_print_lines(card_img):
            h, w = card_img.shape[:2]
            defects.append(Defect(
                defect_type="print_line",
                severity="minor",
                confidence=0.65,
                bbox=(0, h // 4, w, 3 * h // 4),
            ))

        return defects
