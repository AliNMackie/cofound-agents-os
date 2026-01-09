from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
from dotenv import load_dotenv

from src.services.editor import NewsletterEditor
from src.services.style_analyzer import StyleAnalyzer

# Load environment variables
load_dotenv()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Newsletter Engine API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, you might want to restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

editor = NewsletterEditor()
style_analyzer = StyleAnalyzer()
from fastapi import UploadFile, File, Form, Body
from typing import Annotated

from src.schemas import DraftRequest

class DraftResponse(BaseModel):
    draft: str
    template_used: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/version")
async def version_check():
    return {"version": "1.0.1-fix-secrets"}

@app.post("/draft", response_model=DraftResponse)
async def create_draft(request: DraftRequest):
    """
    Generate a newsletter draft using AI based on the provided failed auction data and template.
    """
    draft = await editor.generate_draft(
        raw_data=request.raw_data,
        user_notes=request.free_form_instruction,
        template_id=request.template_id,
        user_signature=request.user_signature,
        branding_instruction=request.branding_instruction
    )
    
    return DraftResponse(
        draft=draft,
        template_used=request.template_id
    )

@app.post("/brand-voice/analyze")
async def analyze_brand_voice(file: UploadFile = File(...)):
    """
    Extracts text from an uploaded file (PDF/Text) and analyzes it for brand voice.
    """
    try:
        text_content = await style_analyzer.extract_from_file(file)
        analysis = await style_analyzer.analyze_voice(text_content)
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class SaveVoiceRequest(BaseModel):
    user_id: str
    voice_data: Dict[str, Any]

@app.post("/brand-voice/save")
async def save_brand_voice(request: SaveVoiceRequest):
    """
    Saves the analyzed brand voice to the user's profile.
    """
    await style_analyzer.save_voice(request.user_id, request.voice_data)
    return {"status": "saved"}

@app.get("/brand-voice/{user_id}")
async def get_brand_voice(user_id: str):
    """
    Retrieves the saved brand voice for a user.
    """
    voice = await style_analyzer.get_voice(user_id)
    if not voice:
        # Return empty structure rather than 404 to simplify frontend logic
        return {"analysis_summary": None, "system_instruction": None}
    return voice

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
