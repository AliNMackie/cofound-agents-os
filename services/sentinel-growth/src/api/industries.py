import structlog
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from google.cloud import firestore

router = APIRouter()
logger = structlog.get_logger()

# Constants
SETTINGS_COL = "settings"
GLOBAL_DOC = "global"
INDUSTRY_CONTEXTS_COL = "industry_contexts"

# Models
class IndustryContextResponse(BaseModel):
    id: str
    name: str
    macroContext: str
    defaultPlaybooks: List[str] = []

# DB Helper
def get_db():
    return firestore.Client()

@router.get("/industries", response_model=List[IndustryContextResponse])
async def get_industries():
    """Fetch all available industry contexts from Firestore."""
    try:
        db = get_db()
        # Path: settings/global/industry_contexts/{id}
        col_ref = db.collection(SETTINGS_COL).document(GLOBAL_DOC).collection(INDUSTRY_CONTEXTS_COL)
        docs = col_ref.stream()
        
        results = []
        for doc in docs:
            data = doc.to_dict()
            # Ensure ID is present (it should be in the doc data, but if not use doc.id)
            if "id" not in data:
                data["id"] = doc.id
            
            results.append(IndustryContextResponse(**data))
            
        return results
        
    except Exception as e:
        logger.error("Failed to fetch industries", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
