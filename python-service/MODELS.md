# ML Models Reference

## Phase 1 — OpenCV (always available)
- **Centering**: Canny edge detection + contour finding → border pixel measurement → PSA-style deviation scoring
- **Preprocessing**: Gaussian blur + Canny → largest-quadrilateral contour → perspective warp to 500×700 px (5:7 card ratio)

## Phase 2 — YOLOv8n + YOLOv8n-seg (auto-download ~12 MB each)
- **Card detection**: `yolov8n.pt` — COCO-pretrained, identifies card as the dominant rectangular object
- **Segmentation**: `yolov8n-seg.pt` — produces a per-pixel card mask used for tight cropping before defect analysis
- Download happens automatically via `ultralytics` on the first request (no manual step required)

## Phase 3 — Custom YOLOv8 (optional, must train or obtain separately)
- **Defect detection**: `weights/card_defects_v1.pt`
- **Classes**:

| ID | Class       | Description                   |
|----|-------------|-------------------------------|
| 0  | crease      | Hard fold lines               |
| 1  | dimple      | Surface dents                 |
| 2  | scratch     | Surface abrasion              |
| 3  | print_line  | Manufacturing line artifact   |
| 4  | stain       | Surface discoloration         |
| 5  | corner_wear | Corner rounding / fraying     |

- **Training**: label your own dataset with [LabelImg](https://github.com/heartexlabs/labelImg) or export from [Roboflow](https://roboflow.com), then run:
  ```bash
  yolo train model=yolov8n-seg.pt data=card_defects.yaml epochs=100 imgsz=640
  cp runs/segment/train/weights/best.pt weights/card_defects_v1.pt
  ```
- Falls back to Phase 2 OpenCV heuristics (`detect_scratches`, `detect_print_lines`) if weights are not present.

## Phase 4 — Detectron2 (optional, ~170 MB weights)
- **Corner scoring**: Mask R-CNN R50-FPN-3x pretrained on COCO
- Only runs on high-value card candidates: YOLOv8 detection confidence > 0.85 **and** card area > 40% of frame
- Analyzes each corner crop for:
  - **Rounding**: convex hull area vs mask area ratio (1.0 = perfectly sharp corner)
  - **Fraying**: contour perimeter vs ideal rectangular perimeter

### Download weights:
```bash
mkdir -p weights
wget -O weights/detectron2_coco_mask_rcnn.pkl \
  https://dl.fbaipublicfiles.com/detectron2/COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x/137849600/model_final_f10217.pkl
```

### Install detectron2:
```bash
pip install 'git+https://github.com/facebookresearch/detectron2.git'
```

---

## Setup Guide

### Development (Phase 1 + 2 only — recommended starting point)
```bash
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# YOLOv8 base models auto-download on first POST request
```

### Full stack (Phase 1–4)
```bash
# Step 1: base deps
pip install -r requirements.txt

# Step 2: Detectron2
pip install 'git+https://github.com/facebookresearch/detectron2.git'

# Step 3: Detectron2 weights
mkdir -p weights
wget -O weights/detectron2_coco_mask_rcnn.pkl \
  https://dl.fbaipublicfiles.com/detectron2/COCO-InstanceSegmentation/mask_rcnn_R_50_FPN_3x/137849600/model_final_f10217.pkl

# Step 4 (optional): custom defect model weights
cp /path/to/card_defects_v1.pt weights/card_defects_v1.pt

uvicorn main:app --reload --port 8000
```

### Docker
```bash
docker build -t card-grader-ml .
docker run -p 8000:8000 \
  -v $(pwd)/weights:/app/weights \
  card-grader-ml
```

---

## API Endpoints

| Method | Path                  | Description                                      |
|--------|-----------------------|--------------------------------------------------|
| POST   | `/analyze/centering`  | OpenCV centering only (fastest, ~200 ms)         |
| POST   | `/analyze/corners`    | Corner scoring (Detectron2 or OpenCV)            |
| POST   | `/analyze/surface`    | Defect detection (YOLOv8 custom or OpenCV)       |
| POST   | `/analyze/condition`  | Grade prediction only                            |
| POST   | `/analyze/complete`   | Full 4-phase pipeline — recommended              |
| GET    | `/health`             | Service status + active model phases             |

## `pipelinePhases` Labels

The `/analyze/complete` response includes a `pipelinePhases` array indicating exactly which code path ran:

| Label                  | Meaning                                          |
|------------------------|--------------------------------------------------|
| `opencv_preprocess`    | Perspective correction applied                   |
| `yolov8_segment`       | Card isolated via YOLOv8n-seg mask               |
| `yolov8_fallback_full_image` | No card detected; full image used          |
| `opencv_centering`     | Border measurement via OpenCV contours           |
| `yolov8_custom_defects`| Phase 3 custom weights used for defects          |
| `opencv_defects`       | OpenCV heuristic fallback for defects            |
| `detectron2_corners`   | Phase 4 Detectron2 corner scoring active         |
| `opencv_corners`       | OpenCV Laplacian fallback for corner scoring     |
