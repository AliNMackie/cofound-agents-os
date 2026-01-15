import structlog
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, field_validator
from typing import List, Optional
from google.cloud import firestore

router = APIRouter()
logger = structlog.get_logger()

# Constants
USER_SETTINGS_COL = "user_settings"
DEFAULT_TENANT_DOC = "default_tenant"

# Models
class DataSourcePayload(BaseModel):
    name: str
    url: str
    type: str = "RSS"
    active: bool = True
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v

class DataSourceResponse(DataSourcePayload):
    id: Optional[str] = None # In case we want to support IDs later, but for now url is key

# DB Helper
def get_db():
    return firestore.Client()

@router.get("/sources", response_model=List[DataSourceResponse])
async def get_sources():
    """Fetch all configured data sources from Firestore."""
    try:
        db = get_db()
        doc_ref = db.collection(USER_SETTINGS_COL).document(DEFAULT_TENANT_DOC)
        doc = doc_ref.get()
        
        if not doc.exists:
            return []
            
        data = doc.to_dict()
        sources_data = data.get("data_sources", [])
        
        # Just pass through, maybe add temporary IDs if needed by frontend or use URL as ID
        results = []
        for s in sources_data:
            # simple transform to ensure model compliance
            results.append(DataSourceResponse(**s))
            
        return results
        
    except Exception as e:
        logger.error("Failed to fetch sources", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sources", response_model=DataSourceResponse)
async def add_source(source: DataSourcePayload):
    """Add a new data source."""
    try:
        db = get_db()
        doc_ref = db.collection(USER_SETTINGS_COL).document(DEFAULT_TENANT_DOC)
        
        doc = doc_ref.get()
        if not doc.exists:
            # Initialize with empty defaults if not present
            current_data = {"data_sources": [], "industry_context": {}}
            doc_ref.set(current_data)
        else:
            current_data = doc.to_dict()
            
        sources = current_data.get("data_sources", [])
        
        # Duplicate check
        for s in sources:
            if s.get("url") == source.url:
                 raise HTTPException(status_code=400, detail="Source with this URL already exists")

        new_source_dict = source.model_dump()
        sources.append(new_source_dict)
        
        doc_ref.update({"data_sources": sources})
        
        return DataSourceResponse(**new_source_dict)

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("Failed to add source", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/sources")
async def delete_source(url: str = Query(..., description="The URL of the source to delete")):
    """Delete a data source by URL."""
    try:
        db = get_db()
        doc_ref = db.collection(USER_SETTINGS_COL).document(DEFAULT_TENANT_DOC)
        doc = doc_ref.get()
        
        if not doc.exists:
             raise HTTPException(status_code=404, detail="Settings not found")
             
        current_data = doc.to_dict()
        sources = current_data.get("data_sources", [])
        
        # Store initial length to check if we removed anything
        initial_len = len(sources)
        new_sources = [s for s in sources if s.get("url") != url]
        
        if len(new_sources) == initial_len:
             raise HTTPException(status_code=404, detail="Source not found")
             
        doc_ref.update({"data_sources": new_sources})
        
        return {"status": "success", "message": "Source deleted"}
        
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error("Failed to delete source", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
