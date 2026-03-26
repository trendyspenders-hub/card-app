import cv2
import numpy as np
from typing import Dict, Any, List
from utils.preprocessing import load_image_from_bytes, resize_for_analysis, detect_card_bounds
from utils.image_processing import detect_scratches, detect_print_lines, analyze_holo_damage


class SurfaceAnalyzer:
    """Analyzes the surface of a sports card for scratches, print lines, and holo damage."""

    def analyze(self, image_bytes: bytes) -> Dict[str, Any]:
        """
        Analyze card surface from image bytes.

        Returns:
            dict with score (1-10), scratches (list), printLines (bool), holoDamage (bool)
        """
        img = load_image_from_bytes(image_bytes)
        img = resize_for_analysis(img)

        x, y, w, h = detect_card_bounds(img)

        # Extract card region (exclude borders)
        margin = int(min(h, w) * 0.05)
        card = img[y+margin:y+h-margin, x+margin:x+w-margin]

        if card.size == 0:
            card = img

        # Run all analyses
        scratches = detect_scratches(card)
        has_print_lines = detect_print_lines(card)
        holo_damage_score = analyze_holo_damage(card)
        has_holo_damage = holo_damage_score > 0.35

        # Calculate overall surface score
        score = self._calculate_score(scratches, has_print_lines, has_holo_damage)

        return {
            "score": round(score, 2),
            "scratches": scratches,
            "printLines": has_print_lines,
            "holoDamage": has_holo_damage,
        }

    def _calculate_score(
        self,
        scratches: List[Dict],
        print_lines: bool,
        holo_damage: bool
    ) -> float:
        """
        Calculate surface score based on detected defects.
        """
        score = 10.0

        # Deduct for scratches
        severe_count = sum(1 for s in scratches if s["severity"] == "severe")
        moderate_count = sum(1 for s in scratches if s["severity"] == "moderate")
        minor_count = sum(1 for s in scratches if s["severity"] == "minor")

        score -= severe_count * 2.5
        score -= moderate_count * 1.0
        score -= minor_count * 0.3

        # Deduct for print lines
        if print_lines:
            score -= 0.75

        # Deduct for holo damage
        if holo_damage:
            score -= 1.5

        return round(min(10.0, max(1.0, score)), 2)
