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

class DraftRequest(BaseModel):
    raw_data: str
    user_notes: Optional[str] = ""
    template_type: Optional[str] = "weekly_memo"

class DraftResponse(BaseModel):
    draft: str
    template_used: str

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/draft", response_model=DraftResponse)
async def create_draft(request: DraftRequest):
    """
    Generate a newsletter draft using AI based on the provided data and template.
    """
    draft = await editor.generate_draft(
        context_data=request.raw_data,
        user_notes=request.user_notes,
        template_type=request.template_type
    )
    
    return DraftResponse(
        draft=draft,
        template_used=request.template_type
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)))
