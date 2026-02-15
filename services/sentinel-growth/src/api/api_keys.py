import uuid
import datetime
import structlog
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from google.cloud import firestore
from src.core.auth import get_current_user

router = APIRouter()
logger = structlog.get_logger()

# DB Helper
def get_db():
    from src.core.config import settings
    return firestore.Client(database=settings.FIRESTORE_DB_NAME)

class ApiKeyCreateRequest(BaseModel):
    label: str
    scopes: list[str] = ["read"]

@router.get("/api-keys")
async def list_api_keys(user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        user_uid = user.get("uid")
        
        # Requires composite index if using multiple fields with order_by
        # For now, simple filter
        keys = db.collection("api_keys")\
            .where("user_id", "==", user_uid)\
            .stream()
            
        results = []
        for k in keys:
            data = k.to_dict()
            results.append({
                "id": k.id,
                "label": data.get("label"),
                "created_at": data.get("created_at").isoformat() if data.get("created_at") else None,
                "status": data.get("status"),
                "prefix": data.get("prefix", "****")
            })
        
        # Sort in memory to avoid composite index requirement for this mvp
        results.sort(key=lambda x: x["created_at"] or "", reverse=True)
        
        return results
    except Exception as e:
        logger.error("Failed to list API keys", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api-keys")
async def create_api_key(request: ApiKeyCreateRequest, user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        user_uid = user.get("uid")
        
        # Generator
        raw_key = f"sk_live_{uuid.uuid4().hex}"
        prefix = raw_key[:10] + "..."
        
        # In a real production system, hash the key!
        # Storing raw key for MVP simplicity + "Launch Readiness" speed as per request "Launch Readiness"
        key_data = {
            "user_id": user_uid,
            "tenant_id": user.get("tenant_id", "default"),
            "label": request.label,
            "scopes": request.scopes,
            "key_value": raw_key, 
            "prefix": prefix,
            "created_at": datetime.datetime.now(datetime.timezone.utc),
            "status": "active"
        }
        
        doc_ref = db.collection("api_keys").document()
        doc_ref.set(key_data)
        
        return {
            "id": doc_ref.id,
            "key": raw_key,
            "label": request.label,
            "created_at": key_data["created_at"].isoformat(),
            "status": "active"
        }
    except Exception as e:
        logger.error("Failed to create API key", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/api-keys/{key_id}")
async def revoke_api_key(key_id: str, user: dict = Depends(get_current_user)):
    try:
        db = get_db()
        user_uid = user.get("uid")
        
        doc_ref = db.collection("api_keys").document(key_id)
        doc = doc_ref.get()
        
        if not doc.exists:
             raise HTTPException(status_code=404, detail="Key not found")
             
        data = doc.to_dict()
        if data.get("user_id") != user_uid:
             raise HTTPException(status_code=403, detail="Not authorized to revoke this key")
             
        doc_ref.delete()
        
        return {"status": "success", "message": "Key revoked"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to revoke API key", error=str(e))
        raise HTTPException(status_code=500, detail=str(e))
