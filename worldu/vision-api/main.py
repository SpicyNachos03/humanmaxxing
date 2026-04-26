from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import base64
import os
from dotenv import load_dotenv
from google import genai
from pydantic import BaseModel

# Load environment variables from .env.local
load_dotenv("../.env.local")
load_dotenv(".env")


class VerifyRequest(BaseModel):
    image_base64: str


app = FastAPI(title="Quest Vision API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("✓ Gemini API configured")
else:
    client = None
    print("⚠ WARNING: GEMINI_API_KEY not set. Add it to your .env.local file.")

# Quest verification prompts - what Gemini should look for
QUEST_PROMPTS = {
    "trash-5": {
        "prompt": "Count the number of pieces of trash, litter, or garbage visible in this image. Only count actual discarded waste items like wrappers, bottles, cans, paper trash, plastic bags, etc. Do NOT count household products, food items, or things that are not trash.",
        "min_count": 5,
        "item_name": "pieces of trash",
    },
    "park-cleanup": {
        "prompt": "Does this image show evidence of park cleanup activity? Look for: collected trash bags, someone picking up litter, or piles of collected garbage in an outdoor/park setting.",
        "min_count": 1,
        "item_name": "cleanup evidence",
    },
    "help-neighbor": {
        "prompt": "Does this image show a person or people? This is for verifying someone helped a neighbor.",
        "min_count": 1,
        "item_name": "person",
    },
    "campus-event": {
        "prompt": "Does this image show a campus event, community gathering, or group meetup? Look for multiple people gathered together, event signage, or organized activities.",
        "min_count": 1,
        "item_name": "event/gathering",
    },
    "walk-10": {
        "prompt": "Does this image show an outdoor scene consistent with taking a walk? Look for sidewalks, paths, trails, streets, parks, or outdoor environments.",
        "min_count": 1,
        "item_name": "outdoor scene",
    },
}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "model": "gemini-3-flash-preview", "configured": client is not None}


@app.post("/verify")
async def verify_quest_photo(
    quest_id: str,
    body: VerifyRequest,
):
    """
    Verify a quest photo using Gemini Vision.
    Accepts base64-encoded image in JSON body.
    """
    if not client:
        raise HTTPException(status_code=503, detail="Gemini API not configured. Set GEMINI_API_KEY in .env.local")
    
    try:
        image_base64 = body.image_base64
        
        # Remove data URL prefix if present
        if "," in image_base64:
            image_base64 = image_base64.split(",")[1]
        
        # Get quest config
        config = QUEST_PROMPTS.get(quest_id, {
            "prompt": "Does this image show evidence of completing a task?",
            "min_count": 1,
            "item_name": "required item",
        })
        
        quest_prompt = config["prompt"]
        min_count = config["min_count"]
        item_name = config["item_name"]
        
        # Build the verification prompt
        prompt = f"""{quest_prompt}

Respond in this exact JSON format:
{{"count": <number of items found>, "verified": <true or false>, "explanation": "<brief explanation of what you see>"}}

Requirements:
- Need at least {min_count} {item_name}
- Be strict - only count items that clearly match the requirement
- If unsure, err on the side of not counting it"""

        # Decode image
        image_bytes = base64.b64decode(image_base64)
        
        # Call Gemini using new API
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=[
                prompt,
                genai.types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg")
            ]
        )
        response_text = response.text.strip()
        
        print(f"Quest: {quest_id}, Min required: {min_count}")
        print(f"Gemini response: {response_text}")
        
        # Parse the JSON response
        import json
        try:
            # Try to extract JSON from response
            if "{" in response_text and "}" in response_text:
                json_str = response_text[response_text.find("{"):response_text.rfind("}")+1]
                result = json.loads(json_str)
                count = result.get("count", 0)
                verified = result.get("verified", False)
                explanation = result.get("explanation", "")
            else:
                # Fallback parsing
                verified = "true" in response_text.lower() or "yes" in response_text.lower()
                count = 0
                explanation = response_text
        except json.JSONDecodeError:
            verified = "true" in response_text.lower() or "yes" in response_text.lower()
            count = 0
            explanation = response_text
        
        # Double check count meets requirement
        if min_count > 1 and count < min_count:
            verified = False
        
        if verified:
            message = f"Verified! Found {count} {item_name}. {explanation}"
        else:
            message = f"Need {min_count} {item_name}, found {count}. {explanation}"
        
        return {
            "quest_id": quest_id,
            "verified": verified,
            "message": message,
            "count": count,
            "required_count": min_count,
        }

    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
