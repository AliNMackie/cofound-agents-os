import pytest
from src.domain.agent import TravelAgent
from src.domain.models import AgentResponse
from src.adapters.mocks import MockCalendar, MockMaps, MockCalendarNoEvent

@pytest.mark.asyncio
async def test_plan_trip_success():
    """Tests the plan_trip method with a successful scenario."""
    # Arrange
    calendar = MockCalendar()
    maps = MockMaps()
    agent = TravelAgent(calendar, maps)
    user_id = "test_user"
    current_location = "456 Oak Ave, Anytown, USA"

    # Act
    response = await agent.plan_trip(user_id, current_location)

    # Assert
    assert isinstance(response, AgentResponse)
    assert "Your next event is 'Team Meeting'" in response.text_to_speak
    assert "approximately 30 minutes" in response.text_to_speak
    assert response.visual_payload["event"]["title"] == "Team Meeting"
    assert response.visual_payload["route"]["distance"] == 15.5

@pytest.mark.asyncio
async def test_plan_trip_no_event():
    """Tests the plan_trip method when there are no upcoming events."""
    # Arrange
    calendar = MockCalendarNoEvent()
    maps = MockMaps()
    agent = TravelAgent(calendar, maps)
    user_id = "test_user"
    current_location = "456 Oak Ave, Anytown, USA"

    # Act
    response = await agent.plan_trip(user_id, current_location)

    # Assert
    assert isinstance(response, AgentResponse)
    assert response.text_to_speak == "You have no upcoming events."
    assert response.visual_payload == {}
