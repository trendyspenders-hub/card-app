import cv2
import numpy as np
from PIL import Image
import io
from typing import Tuple, Optional


def load_image_from_bytes(data: bytes) -> np.ndarray:
    """Load image from raw bytes into OpenCV BGR array."""
    nparr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        # Fallback: use PIL then convert
        pil_img = Image.open(io.BytesIO(data)).convert("RGB")
        img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    return img


def resize_for_analysis(img: np.ndarray, target_size: Tuple[int, int] = (1024, 768)) -> np.ndarray:
    """Resize image maintaining aspect ratio with padding."""
    h, w = img.shape[:2]
    target_w, target_h = target_size

    scale = min(target_w / w, target_h / h)
    new_w = int(w * scale)
    new_h = int(h * scale)

    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_LANCZOS4)

    # Pad to target size
    pad_top = (target_h - new_h) // 2
    pad_bottom = target_h - new_h - pad_top
    pad_left = (target_w - new_w) // 2
    pad_right = target_w - new_w - pad_left

    padded = cv2.copyMakeBorder(
        resized, pad_top, pad_bottom, pad_left, pad_right,
        cv2.BORDER_CONSTANT, value=[0, 0, 0]
    )
    return padded


def detect_card_bounds(img: np.ndarray) -> Tuple[int, int, int, int]:
    """
    Detect card bounding box using edge detection and contour finding.
    Returns (x, y, w, h) of the largest rectangular contour.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    # Apply Gaussian blur to reduce noise
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    # Adaptive thresholding for varied lighting
    binary = cv2.adaptiveThreshold(
        blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY_INV, 11, 2
    )

    # Canny edge detection
    edges = cv2.Canny(blurred, 30, 100)

    # Combine binary and edges
    combined = cv2.bitwise_or(binary, edges)

    # Dilate to connect edges
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
    dilated = cv2.dilate(combined, kernel, iterations=2)

    # Find contours
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        # Fallback: assume card fills most of frame
        margin = int(min(h, w) * 0.05)
        return margin, margin, w - 2 * margin, h - 2 * margin

    # Find the largest quadrilateral contour
    best_contour = None
    best_area = 0
    min_area = (w * h) * 0.1  # at least 10% of image

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < min_area:
            continue

        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.02 * peri, True)

        if area > best_area:
            best_area = area
            best_contour = contour

    if best_contour is not None:
        x, y, cw, ch = cv2.boundingRect(best_contour)
        return x, y, cw, ch

    # Fallback
    margin = int(min(h, w) * 0.05)
    return margin, margin, w - 2 * margin, h - 2 * margin


def correct_perspective(img: np.ndarray) -> np.ndarray:
    """
    Detect card edges and apply perspective correction.
    Returns perspective-corrected image of standard card aspect ratio.
    """
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape

    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)

    # Dilate edges to close gaps
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(edges, kernel, iterations=2)

    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best_quad = None
    best_area = 0

    for contour in contours:
        area = cv2.contourArea(contour)
        if area < (w * h) * 0.15:
            continue

        peri = cv2.arcLength(contour, True)
        approx = cv2.approxPolyDP(contour, 0.03 * peri, True)

        if len(approx) == 4 and area > best_area:
            best_area = area
            best_quad = approx

    if best_quad is None:
        # No quad found, return cropped version
        x, y, cw, ch = detect_card_bounds(img)
        return img[y:y+ch, x:x+cw]

    # Order points: top-left, top-right, bottom-right, bottom-left
    pts = best_quad.reshape(4, 2).astype(np.float32)
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)

    ordered = np.zeros((4, 2), dtype=np.float32)
    ordered[0] = pts[np.argmin(s)]      # top-left
    ordered[2] = pts[np.argmax(s)]      # bottom-right
    ordered[1] = pts[np.argmin(diff)]   # top-right
    ordered[3] = pts[np.argmax(diff)]   # bottom-left

    # Standard card dimensions (2.5" x 3.5" = 5:7 ratio)
    target_w = 500
    target_h = 700

    dst = np.array([
        [0, 0],
        [target_w - 1, 0],
        [target_w - 1, target_h - 1],
        [0, target_h - 1]
    ], dtype=np.float32)

    M = cv2.getPerspectiveTransform(ordered, dst)
    warped = cv2.warpPerspective(img, M, (target_w, target_h))
    return warped


def normalize_image(img: np.ndarray) -> np.ndarray:
    """Normalize image for ML processing."""
    normalized = img.astype(np.float32) / 255.0
    return normalized
