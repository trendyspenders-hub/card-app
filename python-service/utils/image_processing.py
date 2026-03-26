import cv2
import numpy as np
from typing import List, Dict, Any, Tuple
from scipy import ndimage


def compute_edge_sharpness(img: np.ndarray) -> float:
    """
    Compute edge sharpness using Laplacian variance.
    Higher values = sharper edges.
    Returns normalized score 0-10.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    variance = laplacian.var()

    # Normalize to 0-10 scale
    # Typical range: 0 (very blurry) to ~1000+ (very sharp)
    score = min(10.0, (variance / 100.0) ** 0.5)
    return round(score, 2)


def detect_scratches(img: np.ndarray) -> List[Dict[str, Any]]:
    """
    Detect surface scratches using line detection and edge analysis.
    Returns list of {x, y, width, height, severity} dicts.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    h, w = gray.shape

    scratches = []

    # Enhance contrast
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    # Detect lines using Sobel
    sobelx = cv2.Sobel(enhanced, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(enhanced, cv2.CV_64F, 0, 1, ksize=3)
    sobel_mag = np.sqrt(sobelx**2 + sobely**2).astype(np.uint8)

    # Threshold for high-contrast lines
    _, high_contrast = cv2.threshold(sobel_mag, 150, 255, cv2.THRESH_BINARY)

    # Morphological operations to find scratch-like structures
    kernel_h = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 1))
    kernel_v = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 15))

    horizontal_lines = cv2.morphologyEx(high_contrast, cv2.MORPH_OPEN, kernel_h)
    vertical_lines = cv2.morphologyEx(high_contrast, cv2.MORPH_OPEN, kernel_v)
    combined_lines = cv2.bitwise_or(horizontal_lines, vertical_lines)

    # Dilate to merge nearby pixels
    dilate_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(combined_lines, dilate_kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    # Exclude border regions (edges of card aren't scratches)
    margin = int(min(h, w) * 0.05)

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < 30:  # too small to matter
            continue

        x, y, cw, ch = cv2.boundingRect(contour)

        # Skip border regions
        if x < margin or y < margin or (x + cw) > (w - margin) or (y + ch) > (h - margin):
            continue

        # Determine severity based on area and intensity
        if area > 500:
            severity = "severe"
        elif area > 100:
            severity = "moderate"
        else:
            severity = "minor"

        scratches.append({
            "x": int(x),
            "y": int(y),
            "width": int(cw),
            "height": int(ch),
            "severity": severity
        })

    # Limit to most significant scratches
    scratches.sort(key=lambda s: (s["severity"] == "severe", s["width"] * s["height"]), reverse=True)
    return scratches[:10]


def detect_print_lines(img: np.ndarray) -> bool:
    """
    Detect manufacturing print lines using FFT frequency analysis.
    Print lines appear as regular periodic patterns.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img

    # Apply FFT
    f = np.fft.fft2(gray.astype(np.float64))
    fshift = np.fft.fftshift(f)
    magnitude = 20 * np.log(np.abs(fshift) + 1)

    h, w = magnitude.shape
    center_y, center_x = h // 2, w // 2

    # Mask out DC component (center)
    mask_radius = min(h, w) // 10
    y_coords, x_coords = np.ogrid[:h, :w]
    center_mask = (y_coords - center_y)**2 + (x_coords - center_x)**2 < mask_radius**2
    magnitude[center_mask] = 0

    # Look for strong periodic peaks (print lines show as spikes)
    threshold = np.mean(magnitude) + 3 * np.std(magnitude)
    strong_peaks = magnitude > threshold

    # Count isolated strong peaks
    labeled, num_features = ndimage.label(strong_peaks)
    peak_count = num_features

    # Print lines typically show 4-8 symmetric peaks
    return 4 <= peak_count <= 20


def analyze_holo_damage(img: np.ndarray) -> float:
    """
    Analyze holographic/foil area for damage using color consistency.
    Returns damage score 0.0-1.0 (higher = more damage).
    """
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV) if len(img.shape) == 3 else img

    # Foil areas typically have high saturation and varying hue
    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]

    # Find potential foil/holo regions (high saturation, high brightness)
    foil_mask = (saturation > 100) & (value > 150)

    if foil_mask.sum() < 100:
        return 0.0  # No foil area detected

    # Analyze consistency in foil region
    foil_region_v = value[foil_mask]
    foil_std = np.std(foil_region_v.astype(float))

    # High std deviation in value channel = damage/inconsistency
    damage_score = min(1.0, foil_std / 80.0)
    return round(float(damage_score), 3)


def measure_borders(img: np.ndarray, card_bounds: Tuple[int, int, int, int]) -> Dict[str, float]:
    """
    Measure the border widths of a card in pixels.
    card_bounds: (x, y, w, h) of the card within the image.
    Returns {left, right, top, bottom} in pixels.
    """
    x, y, cw, ch = card_bounds
    img_h, img_w = img.shape[:2]

    left = float(x)
    top = float(y)
    right = float(img_w - (x + cw))
    bottom = float(img_h - (y + ch))

    # Ensure non-negative
    left = max(1.0, left)
    right = max(1.0, right)
    top = max(1.0, top)
    bottom = max(1.0, bottom)

    return {
        "left": round(left, 1),
        "right": round(right, 1),
        "top": round(top, 1),
        "bottom": round(bottom, 1)
    }


def analyze_corner_sharpness(corner_img: np.ndarray) -> float:
    """
    Analyze a corner crop for sharpness and wear.
    Returns score 0-10 where 10 = perfect sharp corner.
    """
    h, w = corner_img.shape[:2]
    gray = cv2.cvtColor(corner_img, cv2.COLOR_BGR2GRAY) if len(corner_img.shape) == 3 else corner_img

    # Compute Laplacian variance (sharpness)
    laplacian = cv2.Laplacian(gray, cv2.CV_64F)
    sharpness = laplacian.var()

    # Edge detection around corner tip
    edges = cv2.Canny(gray, 50, 150)

    # Look at corner region (innermost 20% of crop)
    corner_size = min(h, w) // 5
    corner_region = edges[:corner_size, :corner_size]
    edge_density = corner_region.sum() / (corner_size ** 2 * 255)

    # High edge density near corner tip = sharp corner
    # Low edge density = rounded/frayed corner
    corner_score = min(10.0, edge_density * 100)

    # Combine sharpness and corner density
    sharpness_score = min(10.0, (sharpness / 50.0) ** 0.4)
    combined = (corner_score * 0.6 + sharpness_score * 0.4)

    return round(min(10.0, max(1.0, combined)), 2)
