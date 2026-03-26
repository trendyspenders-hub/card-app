"""
Models package for the sports card grader ML service.

Exports all model classes for convenient importing from pipeline.py and main.py.

Phase mapping:
  Phase 1 — OpenCV: CenteringAnalyzer
  Phase 2 — YOLOv8n / YOLOv8n-seg: CardDetector
  Phase 2/3 — YOLOv8 (custom or general): DefectDetector
  Phase 4 — Detectron2: DeepCornerScorer
  Scoring — GradePredictor (no ML, weighted formula)
"""

from .centering import CenteringAnalyzer
from .corners import CornerAnalyzer
from .surface import SurfaceAnalyzer
from .grade_predictor import GradePredictor
from .card_detector import CardDetector, CardDetection
from .defect_detector import DefectDetector, Defect, DEFECT_CLASSES, SEVERITY_THRESHOLDS
from .deep_corner_scorer import DeepCornerScorer

__all__ = [
    # Phase 1 — OpenCV centering
    "CenteringAnalyzer",
    # Phase 2 — YOLOv8 card detection + segmentation
    "CardDetector",
    "CardDetection",
    # Phase 2/3 — Defect detection
    "DefectDetector",
    "Defect",
    "DEFECT_CLASSES",
    "SEVERITY_THRESHOLDS",
    # Phase 4 — Detectron2 corner scoring
    "DeepCornerScorer",
    # Grade prediction
    "GradePredictor",
    # Legacy individual analyzers (preserved for backward compatibility)
    "CornerAnalyzer",
    "SurfaceAnalyzer",
]
