import pytest
from unittest.mock import patch, MagicMock
from src.adapters.google_maps import GoogleMapsAdapter

@pytest.mark.asyncio
async def test_calculate_route_success():
    """Tests the calculate_route method with a successful API response."""
    # Arrange
    adapter = GoogleMapsAdapter(api_key="AIza_fake_api_key")
    
    mock_directions_result = [{
        'legs': [{
            'distance': {'value': 25000},
            'duration': {'value': 3600},
            'duration_in_traffic': {'value': 4000}
        }]
    }]
    
    with patch.object(adapter.client, 'directions', MagicMock(return_value=mock_directions_result)):
        # Act
        route = await adapter.calculate_route(origin="A", destination="B")
        
        # Assert
        assert route is not None
        assert route['distance'] == 25.0
        assert route['duration'] == 3600
        assert route['traffic_condition'] == "moderate"

@pytest.mark.asyncio
async def test_calculate_route_no_result():
    """Tests the calculate_route method when the API returns no route."""
    # Arrange
    adapter = GoogleMapsAdapter(api_key="AIza_fake_api_key")
    
    with patch.object(adapter.client, 'directions', MagicMock(return_value=[])):
        # Act
        route = await adapter.calculate_route(origin="A", destination="B")
        
        # Assert
        assert route is None
