import cv2
import numpy as np
from typing import Dict, Any
from utils.preprocessing import load_image_from_bytes, resize_for_analysis, detect_card_bounds
from utils.image_processing import analyze_corner_sharpness, compute_edge_sharpness


class CornerAnalyzer:
    """Analyzes all four corners of a sports card for wear and damage."""

    def analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze card corners from image bytes.

        Returns:
            dict with frontLeft, frontRight, backLeft, backRight (1-10 scores),
            and overall score.
        """
        img = load_image_from_bytes(image_bytes)
        img = resize_for_analysis(img)

        x, y, w, h = detect_card_bounds(img)

        # Extract card region
        card = img[y:y+h, x:x+w]
        ch, cw = card.shape[:2]

        # Corner crop size: 10% of the smaller dimension
        corner_size = int(min(ch, cw) * 0.12)
        corner_size = max(corner_size, 30)

        # Crop each corner
        corners = {
            "frontLeft":  card[0:corner_size, 0:corner_size],
            "frontRight": card[0:corner_size, cw-corner_size:cw],
            "backLeft":   card[ch-corner_size:ch, 0:corner_size],
            "backRight":  card[ch-corner_size:ch, cw-corner_size:cw],
        }

        scores = {}
        for corner_name, corner_img in corners.items():
            if corner_img.size == 0:
                scores[corner_name] = 7.5  # default if crop fails
                continue
            raw_score = self._score_corner(corner_img)
            scores[corner_name] = raw_score

        overall = sum(scores.values()) / len(scores)

        return {
            "frontLeft":  round(scores["frontLeft"], 2),
            "frontRight": round(scores["frontRight"], 2),
            "backLeft":   round(scores["backLeft"], 2),
            "backRight":  round(scores["backRight"], 2),
            "overall":    round(overall, 2),
        }

    def _score_corner(self, corner_img: np.ndarray) -> float:
        """
        Score a single corner crop for sharpness and wear.
        Uses multiple metrics to determine corner quality.
        """
        gray = cv2.cvtColor(corner_img, cv2.COLOR_BGR2GRAY) if len(corner_img.shape) == 3 else corner_img
        h, w = gray.shape

        # 1. Edge sharpness via Laplacian
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        sharpness_var = laplacian.var()
        sharpness_score = min(10.0, (sharpness_var / 40.0) ** 0.45)

        # 2. Corner tip analysis: look at the actual corner point
        tip_size = max(h // 5, w // 5, 5)
        corner_tip = gray[:tip_size, :tip_size]
        tip_edges = cv2.Canny(corner_tip, 30, 100)
        tip_edge_density = tip_edges.sum() / (tip_edges.size * 255)
        tip_score = min(10.0, tip_edge_density * 80)

        # 3. Fraying detection: look for irregular edges
        edges = cv2.Canny(gray, 50, 150)
        edge_profile = edges[:, 0]  # leftmost column
        edge_positions = np.where(edge_profile > 0)[0]

        fraying_score = 10.0
        if len(edge_positions) > 3:
            # High variance in edge positions = fraying
            edge_variance = np.var(edge_positions.astype(float))
            fraying_penalty = min(3.0, edge_variance / 5.0)
            fraying_score = max(1.0, 10.0 - fraying_penalty)

        # 4. Rounding detection: corner tip should be sharp (high gradient)
        tip_region = gray[:max(5, h//8), :max(5, w//8)]
        if tip_region.size > 0:
            tip_gradient = np.gradient(tip_region.astype(float))
            tip_gradient_mag = np.sqrt(tip_gradient[0]**2 + tip_gradient[1]**2)
            tip_sharpness = tip_gradient_mag.mean()
            rounding_score = min(10.0, tip_sharpness / 10.0)
        else:
            rounding_score = 7.0

        # Weighted combination
        final_score = (
            sharpness_score * 0.25 +
            tip_score * 0.30 +
            fraying_score * 0.25 +
            rounding_score * 0.20
        )

        return round(min(10.0, max(1.0, final_score)), 2)
