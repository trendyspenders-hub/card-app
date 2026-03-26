"""
Phase 1+2: YOLOv8 card detection and segmentation pipeline.

Uses yolov8n.pt for fast card bounding box detection,
and yolov8n-seg.pt for segmentation mask used in:
  - perspective correction (preprocessing)
  - defect region isolation (surface analysis)
"""
from ultralytics import YOLO
import numpy as np
import cv2
from pathlib import Path
from dataclasses import dataclass
from typing import Optional


@dataclass
class CardDetection:
    bbox: tuple[int, int, int, int]   # x1, y1, x2, y2
    confidence: float
    mask: Optional[np.ndarray]         # segmentation mask if available
    is_high_value_candidate: bool      # triggers Detectron2 deep pass


class CardDetector:
    """
    Wraps YOLOv8n (detection) and YOLOv8n-seg (segmentation).
    Both models auto-download on first use via ultralytics.
    """

    def __init__(self):
        self._det_model: Optional[YOLO] = None
        self._seg_model: Optional[YOLO] = None

    def _load_det(self) -> YOLO:
        if self._det_model is None:
            self._det_model = YOLO("yolov8n.pt")
        return self._det_model

    def _load_seg(self) -> YOLO:
        if self._seg_model is None:
            self._seg_model = YOLO("yolov8n-seg.pt")
        return self._seg_model

    def _is_high_value(self, conf: float, bbox: tuple, img_shape: tuple) -> bool:
        """
        Determine whether this card warrants Detectron2 deep analysis.
        Criteria: high detection confidence AND card occupies a large portion of frame.
        """
        x1, y1, x2, y2 = bbox
        card_area = (x2 - x1) * (y2 - y1)
        img_area = img_shape[0] * img_shape[1]
        return conf > 0.85 and card_area / img_area > 0.4

    def detect(self, img: np.ndarray) -> Optional[CardDetection]:
        """
        Run detection pass to isolate card bounding box.
        Uses yolov8n.pt; selects the highest-confidence detected object.
        Returns None if no object detected above confidence threshold.
        """
        model = self._load_det()
        results = model(img, verbose=False, conf=0.25)[0]
        if len(results.boxes) == 0:
            return None
        # Pick highest-confidence box
        best_idx = int(results.boxes.conf.argmax())
        x1, y1, x2, y2 = map(int, results.boxes.xyxy[best_idx].tolist())
        conf = float(results.boxes.conf[best_idx])
        bbox = (x1, y1, x2, y2)
        return CardDetection(
            bbox=bbox,
            confidence=conf,
            mask=None,
            is_high_value_candidate=self._is_high_value(conf, bbox, img.shape),
        )

    def segment(self, img: np.ndarray) -> Optional[CardDetection]:
        """
        Run segmentation pass to get precise card mask.
        Uses yolov8n-seg.pt. Falls back to detect() if no masks produced.
        Mask is resized to full image dimensions and binarized at 0.5 threshold.
        """
        model = self._load_seg()
        results = model(img, verbose=False, conf=0.25)[0]
        if results.masks is None or len(results.masks) == 0:
            return self.detect(img)
        best_idx = int(results.boxes.conf.argmax())
        x1, y1, x2, y2 = map(int, results.boxes.xyxy[best_idx].tolist())
        conf = float(results.boxes.conf[best_idx])
        # Resize mask to original image dimensions
        raw_mask = results.masks.data[best_idx].cpu().numpy()
        mask = cv2.resize(raw_mask, (img.shape[1], img.shape[0]))
        mask = (mask > 0.5).astype(np.uint8) * 255
        bbox = (x1, y1, x2, y2)
        return CardDetection(
            bbox=bbox,
            confidence=conf,
            mask=mask,
            is_high_value_candidate=self._is_high_value(conf, bbox, img.shape),
        )
