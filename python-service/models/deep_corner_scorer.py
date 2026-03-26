"""
Phase 4: Detectron2 instance segmentation for high-precision corner scoring.

Only runs for high-value card candidates (confidence > 0.85, large card area).
Uses mask_rcnn_R_50_FPN_3x pretrained on COCO as backbone;
corner crops are analyzed via per-instance segmentation masks to precisely
measure edge straightness, corner rounding, and fiber fraying.

Weights: download separately:
  wget https://dl.fbaipublicfiles.com/detectron2/COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x/137849600/model_final_f10217.pkl
  Place at: python-service/weights/detectron2_coco_mask_rcnn.pkl

Install Detectron2:
  pip install 'git+https://github.com/facebookresearch/detectron2.git'
"""
import numpy as np
import cv2
from pathlib import Path
from typing import Optional
import logging

logger = logging.getLogger(__name__)

WEIGHTS_PATH = Path(__file__).parent.parent / "weights" / "detectron2_coco_mask_rcnn.pkl"


class DeepCornerScorer:
    """
    Detectron2-powered corner scorer.

    When Detectron2 weights are present and the library is installed, each corner
    crop is run through Mask R-CNN. The resulting instance masks are analyzed for:
      - Rounding: convex hull area vs mask area ratio (1.0 = perfectly sharp)
      - Fraying: contour perimeter vs ideal rectangular perimeter

    Gracefully degrades to an OpenCV Laplacian + Canny scorer when weights are
    unavailable or detectron2 is not installed.
    """

    def __init__(self):
        self._predictor = None
        self._available: bool = False
        self._try_load()

    def _try_load(self) -> None:
        """Attempt to load Detectron2 predictor. Silently falls back on any failure."""
        if not WEIGHTS_PATH.exists():
            logger.info(
                "Detectron2 weights not found at %s — using OpenCV fallback", WEIGHTS_PATH
            )
            return
        try:
            from detectron2.config import get_cfg
            from detectron2 import model_zoo
            from detectron2.engine import DefaultPredictor

            cfg = get_cfg()
            cfg.merge_from_file(
                model_zoo.get_config_file(
                    "COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x.yaml"
                )
            )
            cfg.MODEL.WEIGHTS = str(WEIGHTS_PATH)
            cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = 0.5
            cfg.MODEL.DEVICE = "cpu"
            self._predictor = DefaultPredictor(cfg)
            self._available = True
            logger.info("Detectron2 loaded successfully from %s", WEIGHTS_PATH)
        except ImportError:
            logger.warning(
                "detectron2 not installed — run: "
                "pip install 'git+https://github.com/facebookresearch/detectron2.git'"
            )
        except Exception as exc:
            logger.warning("Detectron2 load failed: %s", exc)

    def _score_corner_opencv(self, corner_crop: np.ndarray) -> float:
        """
        OpenCV fallback scorer.
        Combines Laplacian variance (overall sharpness) with Canny edge density
        (measures how much high-frequency edge information exists near the corner tip).
        Score range: 1.0–10.0
        """
        gray = (
            cv2.cvtColor(corner_crop, cv2.COLOR_BGR2GRAY)
            if len(corner_crop.shape) == 3
            else corner_crop
        )
        lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
        edges = cv2.Canny(gray, 50, 150)
        edge_density = edges.sum() / (gray.shape[0] * gray.shape[1] * 255 + 1e-6)
        # lap_var ~500 → score ~6; edge_density ~0.1 → +4
        score = min(10.0, (lap_var / 500) * 6 + edge_density * 40)
        return max(1.0, score)

    def _score_corner_detectron2(self, corner_crop: np.ndarray) -> float:
        """
        Detectron2 path: run Mask R-CNN on corner crop, analyze the largest
        instance mask for rounding (hull-area ratio) and fraying (perimeter jaggedness).

        Falls back to OpenCV scorer if no instances are detected.
        Score range: 1.0–10.0
        """
        outputs = self._predictor(corner_crop)
        instances = outputs["instances"]
        if len(instances) == 0:
            return self._score_corner_opencv(corner_crop)

        # Use the largest instance mask (most likely the card edge)
        masks = instances.pred_masks.cpu().numpy()
        areas = [m.sum() for m in masks]
        largest_idx = int(np.argmax(areas))
        mask = masks[largest_idx].astype(np.uint8) * 255

        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return self._score_corner_opencv(corner_crop)

        cnt = max(contours, key=cv2.contourArea)
        hull = cv2.convexHull(cnt)
        hull_area = cv2.contourArea(hull)
        mask_area = cv2.contourArea(cnt)

        # Rounding ratio: 1.0 = perfectly sharp convex corner, <0.9 = rounded
        rounding_ratio = mask_area / (hull_area + 1e-6)

        # Fraying: actual perimeter vs ideal perimeter of the crop rectangle
        perimeter = cv2.arcLength(cnt, True)
        ideal_perimeter = 4 * (corner_crop.shape[0] + corner_crop.shape[1]) / 2
        # jaggedness > 1.0 means extra perimeter from fraying; cap at 1.0 penalty
        jaggedness_penalty = min(1.0, max(0.0, perimeter / (ideal_perimeter + 1e-6) - 1.0))

        # Score: 10 = perfectly sharp/flat corner, 1 = heavily rounded or frayed
        score = rounding_ratio * 7.0 + (1.0 - jaggedness_penalty) * 3.0
        return max(1.0, min(10.0, score))

    def score_corners(self, card_img: np.ndarray) -> dict:
        """
        Score all 4 corners of a card image.

        Corner crops are 15% of the smaller card dimension to capture the tip
        and surrounding edge region without overlapping the card center.

        Returns dict with keys:
          frontLeft, frontRight, backLeft, backRight (float 1–10),
          overall (float, mean of four corners),
          used_detectron2 (bool)
        """
        h, w = card_img.shape[:2]
        crop_size = max(10, int(min(h, w) * 0.15))

        corners = {
            "frontLeft":  card_img[0:crop_size, 0:crop_size],
            "frontRight": card_img[0:crop_size, w - crop_size:w],
            "backLeft":   card_img[h - crop_size:h, 0:crop_size],
            "backRight":  card_img[h - crop_size:h, w - crop_size:w],
        }

        scorer = (
            self._score_corner_detectron2
            if self._available
            else self._score_corner_opencv
        )

        scores: dict = {}
        for name, crop in corners.items():
            if crop.size == 0:
                scores[name] = 7.5
            else:
                scores[name] = round(scorer(crop), 1)

        scores["overall"] = round(
            sum(v for k, v in scores.items() if k != "overall") / 4, 1
        )
        scores["used_detectron2"] = self._available
        return scores
