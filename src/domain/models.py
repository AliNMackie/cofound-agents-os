from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Any

class Event(BaseModel):
    title: str
    start_time: datetime
    location: str

class Route(BaseModel):
    distance: float
    duration: float
    traffic_condition: str

class AgentResponse(BaseModel):
    text_to_speak: str
    visual_payload: Dict[str, Any]
