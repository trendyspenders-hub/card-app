import cv2
import numpy as np
from typing import Dict, Any
from utils.preprocessing import load_image_from_bytes, resize_for_analysis
from utils.image_processing import compute_edge_sharpness


# Weights used by PSA (approximate)
GRADE_WEIGHTS = {
    "centering": 0.25,
    "corners":   0.35,
    "edges":     0.20,
    "surface":   0.20,
}


class GradePredictor:
    """
    Predicts PSA-equivalent grade from component analysis scores.
    Uses weighted combination of centering, corners, edges, and surface.
    """

    def predict(
        self,
        centering_result: Dict[str, Any],
        corner_result: Dict[str, Any],
        surface_result: Dict[str, Any],
        image_bytes: bytes = None
    ) -> Dict[str, Any]:
        """
        Predict grade from component analysis results.

        Args:
            centering_result: output from CenteringAnalyzer.analyze()
            corner_result: output from CornerAnalyzer.analyze()
            surface_result: output from SurfaceAnalyzer.analyze()
            image_bytes: optional raw image for edge quality analysis

        Returns:
            dict with predictedGrade, confidence, breakdown
        """
        centering_score = centering_result.get("score", 8.0)
        corners_score = corner_result.get("overall", 8.0)
        surface_score = surface_result.get("score", 8.0)

        # Edge score: estimated from corners and surface averages
        # In production this would analyze edge regions specifically
        edge_score = self._estimate_edge_score(
            corners_score, surface_score, image_bytes
        )

        # Weighted combination
        raw_grade = (
            centering_score * GRADE_WEIGHTS["centering"] +
            corners_score   * GRADE_WEIGHTS["corners"] +
            edge_score      * GRADE_WEIGHTS["edges"] +
            surface_score   * GRADE_WEIGHTS["surface"]
        )

        # Apply floor: the weakest category pulls the grade down significantly
        min_score = min(centering_score, corners_score, edge_score, surface_score)
        if min_score < raw_grade - 2.0:
            raw_grade = raw_grade * 0.85 + min_score * 0.15

        predicted_grade = round(min(10.0, max(1.0, raw_grade)), 2)

        # Calculate confidence based on image quality
        confidence = self._calculate_confidence(
            centering_score, corners_score, edge_score, surface_score,
            image_bytes
        )

        return {
            "predictedGrade": predicted_grade,
            "confidence": round(confidence, 3),
            "breakdown": {
                "centering": round(centering_score, 2),
                "corners":   round(corners_score, 2),
                "edges":     round(edge_score, 2),
                "surface":   round(surface_score, 2),
            }
        }

    def _estimate_edge_score(
        self,
        corners_score: float,
        surface_score: float,
        image_bytes: bytes = None
    ) -> float:
        """
        Estimate edge quality score.
        If image available, analyze edge regions. Otherwise estimate from corners.
        """
        if image_bytes and len(image_bytes) > 100:
            try:
                img = load_image_from_bytes(image_bytes)
                img = resize_for_analysis(img)
                h, w = img.shape[:2]

                # Extract thin edge strips
                edge_width = max(int(min(h, w) * 0.04), 5)
                edges = {
                    "top":    img[:edge_width, edge_width:-edge_width],
                    "bottom": img[h-edge_width:, edge_width:-edge_width],
                    "left":   img[edge_width:-edge_width, :edge_width],
                    "right":  img[edge_width:-edge_width, w-edge_width:],
                }

                edge_scores = []
                for edge_name, edge_strip in edges.items():
                    if edge_strip.size > 0:
                        sharpness = compute_edge_sharpness(edge_strip)
                        # Detect nicks: look for sudden color changes
                        gray_edge = cv2.cvtColor(edge_strip, cv2.COLOR_BGR2GRAY) if len(edge_strip.shape) == 3 else edge_strip
                        std = float(np.std(gray_edge))
                        nick_penalty = min(3.0, std / 30.0)
                        edge_score = max(1.0, min(10.0, sharpness - nick_penalty + 3))
                        edge_scores.append(edge_score)

                if edge_scores:
                    return round(sum(edge_scores) / len(edge_scores), 2)
            except Exception:
                pass

        # Fallback: estimate from corners (edges and corners degrade similarly)
        return round((corners_score * 0.7 + surface_score * 0.3), 2)

    def _calculate_confidence(
        self,
        centering_score: float,
        corners_score: float,
        edge_score: float,
        surface_score: float,
        image_bytes: bytes = None
    ) -> float:
        """
        Calculate confidence score based on consistency of component scores
        and image quality.
        """
        scores = [centering_score, corners_score, edge_score, surface_score]

        # Low variance = high confidence
        variance = np.var(scores)
        consistency_confidence = max(0.4, 1.0 - (variance / 20.0))

        # Image quality affects confidence
        image_confidence = 0.80  # default
        if image_bytes and len(image_bytes) > 100:
            try:
                img = load_image_from_bytes(image_bytes)
                sharpness = compute_edge_sharpness(img)
                # Sharp image = higher confidence
                image_confidence = min(0.95, 0.5 + (sharpness / 20.0))
            except Exception:
                pass

        # Score-based confidence: high grades and very low grades are more certain
        avg_score = sum(scores) / len(scores)
        if avg_score >= 9.5 or avg_score <= 3.0:
            score_confidence = 0.90
        elif avg_score >= 8.5 or avg_score <= 5.0:
            score_confidence = 0.82
        else:
            score_confidence = 0.72

        final_confidence = (
            consistency_confidence * 0.35 +
            image_confidence * 0.35 +
            score_confidence * 0.30
        )

        return round(min(0.97, max(0.45, final_confidence)), 3)
