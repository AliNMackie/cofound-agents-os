import asyncio
from typing import Dict, Any, Optional
import googlemaps
from src.domain.interfaces import MapsInterface

class GoogleMapsAdapter(MapsInterface):
    """Adapter for the Google Maps API."""

    def __init__(self, api_key: str):
        self.client = googlemaps.Client(key=api_key)

    async def calculate_route(self, origin: str, destination: str) -> Optional[Dict[str, Any]]:
        """
        Calculates the route between an origin and a destination asynchronously.
        """
        def _calculate():
            try:
                directions_result = self.client.directions(origin, destination, mode="driving")

                if not directions_result or not directions_result[0]['legs']:
                    return None

                leg = directions_result[0]['legs'][0]
                
                distance_km = leg['distance']['value'] / 1000.0
                duration_sec = leg['duration']['value']

                traffic_condition = "light"
                if 'duration_in_traffic' in leg and leg['duration_in_traffic']['value'] > duration_sec * 1.2:
                    traffic_condition = "heavy"
                elif 'duration_in_traffic' in leg and leg['duration_in_traffic']['value'] > duration_sec * 1.1:
                    traffic_condition = "moderate"

                return {
                    "distance": distance_km,
                    "duration": duration_sec,
                    "traffic_condition": traffic_condition
                }
            except googlemaps.exceptions.ApiError as e:
                print(f"An error occurred with Google Maps API: {e}")
                return None
            except (IndexError, KeyError) as e:
                print(f"Error parsing Google Maps API response: {e}")
                return None
        
        return await asyncio.to_thread(_calculate)
