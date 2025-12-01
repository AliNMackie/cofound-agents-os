from .interfaces import CalendarInterface, MapsInterface
from .models import Event, Route, AgentResponse

class TravelAgent:
    def __init__(self, calendar: CalendarInterface, maps: MapsInterface):
        self.calendar = calendar
        self.maps = maps

    async def plan_trip(self, user_id: str, current_location: str) -> AgentResponse:
        """
        Plans a trip to the user's next event asynchronously.

        Args:
            user_id: The ID of the user.
            current_location: The user's current location.

        Returns:
            An AgentResponse containing the trip plan.
        """
        next_event_data = await self.calendar.get_next_event(user_id)
        if not next_event_data:
            return AgentResponse(
                text_to_speak="You have no upcoming events.",
                visual_payload={}
            )

        event = Event(**next_event_data)

        route_data = await self.maps.calculate_route(
            origin=current_location,
            destination=event.location
        )

        if not route_data:
            return AgentResponse(
                text_to_speak=f"I could not find a route to {event.location}.",
                visual_payload={"event": event.model_dump()}
            )

        route = Route(**route_data)

        response_text = (
            f"Your next event is '{event.title}' at {event.location}. "
            f"It will take you approximately {round(route.duration / 60)} minutes to get there. "
            f"The distance is {route.distance} kilometers."
        )

        return AgentResponse(
            text_to_speak=response_text,
            visual_payload={
                "event": event.model_dump(),
                "route": route.model_dump()
            }
        )
