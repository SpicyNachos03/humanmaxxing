# Quest Vision API

YOLO-based computer vision service for verifying quest photos.

## Setup

```bash
cd vision-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Run

```bash
python main.py
```

The API will start on http://localhost:8001

## Endpoints

- `GET /health` - Health check
- `POST /verify?quest_id=<id>` - Verify a quest photo (accepts `image_base64` in body)
- `POST /detect` - General object detection (accepts `image_base64` in body)

## Quest Requirements

Each quest has specific object detection requirements:

| Quest ID | Required Objects |
|----------|-----------------|
| trash-5 | bottle, cup, bag, trash |
| park-cleanup | bottle, cup, bag, person |
| help-neighbor | person |
| campus-event | person, chair, bench, building |
| walk-10 | tree, car, person, building |

## Environment Variable

Add to your `.env.local`:
```
VISION_API_URL=http://localhost:8001
```
