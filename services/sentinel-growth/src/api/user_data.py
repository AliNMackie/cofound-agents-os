from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from src.core.auth import AuthenticatedUser, get_current_user
from src.services.persistence import persistence_service
import structlog

router = APIRouter(prefix="/api/v1/user", tags=["User Data"])
logger = structlog.get_logger()

class NotebookRequest(BaseModel):
    content: str

@router.get("/notebook")
async def get_notebook(user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieve the current user's notebook content."""
    try:
        content = await persistence_service.get_notebook(user.uid)
        return {"content": content}
    except Exception as e:
        logger.error("Failed to get notebook", uid=user.uid, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve notebook")

@router.post("/notebook")
async def save_notebook(request: NotebookRequest, user: AuthenticatedUser = Depends(get_current_user)):
    """Save content to the user's notebook."""
    try:
        await persistence_service.save_notebook(user.uid, request.content)
        return {"status": "success", "message": "Notebook saved"}
    except Exception as e:
        logger.error("Failed to save notebook", uid=user.uid, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to save notebook")

@router.get("/subscription")
async def get_subscription(user: AuthenticatedUser = Depends(get_current_user)):
    """Retrieve the tenant's subscription details."""
    try:
        subscription = await persistence_service.get_subscription(user.tenant_id)
        return subscription
    except Exception as e:
        logger.error("Failed to get subscription", tenant_id=user.tenant_id, error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve subscription")
