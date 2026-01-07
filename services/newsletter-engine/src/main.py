from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from dotenv import load_dotenv

from src.services.editor import NewsletterEditor

# Load environment variables
load_dotenv()

app = FastAPI(title="Newsletter Engine API")
editor = NewsletterEditor()

from src.schemas import DraftRequest

class DraftResponse(BaseModel):
    draft: str
    template_used: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/draft", response_model=DraftResponse)
async def create_draft(request: DraftRequest):
    """
    Generate a newsletter draft using AI based on the provided failed auction data and template.
    """
    draft = await editor.generate_draft(
        raw_data=request.raw_data,
        user_notes=request.free_form_instruction,
        template_id=request.template_id,
        user_signature=request.user_signature
    )
    
    return DraftResponse(
        draft=draft,
        template_used=request.template_id
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
