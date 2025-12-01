from abc import ABC, abstractmethod
from typing import List, Dict, Any

class CalendarInterface(ABC):
    @abstractmethod
    async def get_next_event(self, user_id: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    async def list_events(self, user_id: str) -> List[Dict[str, Any]]:
        pass

class MapsInterface(ABC):
    @abstractmethod
    async def calculate_route(self, origin: str, destination: str) -> Dict[str, Any]:
        pass

class TokenStoreInterface(ABC):
    @abstractmethod
    def save_tokens(self, user_id: str, tokens: Dict[str, Any]):
        pass

    @abstractmethod
    def get_tokens(self, user_id: str) -> Dict[str, Any]:
        pass
