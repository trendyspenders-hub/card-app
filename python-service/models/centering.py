import cv2
import numpy as np
from typing import Dict, Any
from utils.preprocessing import load_image_from_bytes, resize_for_analysis, detect_card_bounds
from utils.image_processing import measure_borders


class CenteringAnalyzer:
    """Analyzes card centering by measuring border widths."""

    def analyze_image(self, img: np.ndarray) -> Dict[str, Any]:
        """
        Analyze card centering from a pre-loaded and pre-processed numpy array.
        Used by the pipeline when the image has already been decoded and
        perspective-corrected before this call.

        Returns the same dict as analyze(): left, right, top, bottom (pixels),
        leftPct, rightPct, topPct, bottomPct (percentages), score (1-10).
        """
        card_bounds = detect_card_bounds(img)
        borders = measure_borders(img, card_bounds)

        left = borders["left"]
        right = borders["right"]
        top = borders["top"]
        bottom = borders["bottom"]

        lr_total = left + right
        tb_total = top + bottom

        left_pct = (left / lr_total) * 100 if lr_total > 0 else 50.0
        right_pct = (right / lr_total) * 100 if lr_total > 0 else 50.0
        top_pct = (top / tb_total) * 100 if tb_total > 0 else 50.0
        bottom_pct = (bottom / tb_total) * 100 if tb_total > 0 else 50.0

        lr_deviation = abs(left_pct - 50.0)
        tb_deviation = abs(top_pct - 50.0)
        max_deviation = max(lr_deviation, tb_deviation)

        score = self._calculate_score(max_deviation)

        return {
            "left": round(left, 1),
            "right": round(right, 1),
            "top": round(top, 1),
            "bottom": round(bottom, 1),
            "leftPct": round(left_pct, 1),
            "rightPct": round(right_pct, 1),
            "topPct": round(top_pct, 1),
            "bottomPct": round(bottom_pct, 1),
            "score": round(score, 2),
        }

    def analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze card centering from image bytes.

        Returns:
            dict with keys: left, right, top, bottom (pixels),
            leftPct, rightPct, topPct, bottomPct (percentages),
            score (1-10)
        """
        img = load_image_from_bytes(image_bytes)
        img = resize_for_analysis(img)

        card_bounds = detect_card_bounds(img)
        borders = measure_borders(img, card_bounds)

        left = borders["left"]
        right = borders["right"]
        top = borders["top"]
        bottom = borders["bottom"]

        # Calculate percentages
        lr_total = left + right
        tb_total = top + bottom

        left_pct = (left / lr_total) * 100 if lr_total > 0 else 50.0
        right_pct = (right / lr_total) * 100 if lr_total > 0 else 50.0
        top_pct = (top / tb_total) * 100 if tb_total > 0 else 50.0
        bottom_pct = (bottom / tb_total) * 100 if tb_total > 0 else 50.0

        # Calculate score based on PSA standards
        lr_deviation = abs(left_pct - 50.0)
        tb_deviation = abs(top_pct - 50.0)
        max_deviation = max(lr_deviation, tb_deviation)

        score = self._calculate_score(max_deviation)

        return {
            "left": round(left, 1),
            "right": round(right, 1),
            "top": round(top, 1),
            "bottom": round(bottom, 1),
            "leftPct": round(left_pct, 1),
            "rightPct": round(right_pct, 1),
            "topPct": round(top_pct, 1),
            "bottomPct": round(bottom_pct, 1),
            "score": round(score, 2)
        }

    def _calculate_score(self, max_deviation: float) -> float:
        """
        Calculate centering score based on maximum deviation from center.

        PSA standards:
        - 10: 55/45 or better (deviation <= 5)
        - 9:  60/40 or better (deviation <= 10)
        - 8:  65/35 or better (deviation <= 15)
        - 7:  70/30 or better (deviation <= 20)
        - 6:  75/25 or better (deviation <= 25)
        - below 6: worse than 75/25
        """
        if max_deviation <= 5:
            # Perfect centering — interpolate between 9.5 and 10
            score = 10.0 - (max_deviation / 5.0) * 0.5
        elif max_deviation <= 10:
            # PSA 9 range
            score = 9.5 - ((max_deviation - 5) / 5.0) * 0.5
        elif max_deviation <= 15:
            # PSA 8 range
            score = 9.0 - ((max_deviation - 10) / 5.0) * 1.0
        elif max_deviation <= 20:
            # PSA 7 range
            score = 8.0 - ((max_deviation - 15) / 5.0) * 1.0
        elif max_deviation <= 25:
            # PSA 6 range
            score = 7.0 - ((max_deviation - 20) / 5.0) * 1.0
        elif max_deviation <= 30:
            # PSA 5 range
            score = 6.0 - ((max_deviation - 25) / 5.0) * 1.0
        else:
            # PSA 4 and below
            score = max(1.0, 5.0 - (max_deviation - 30) / 10.0)

        return round(min(10.0, max(1.0, score)), 2)
