import logging
import datetime
from src.agents.calendar_manager.logic import MorningBriefingAgent
from src.providers.google_calendar import GoogleCalendarProvider

# Configure logging
logging.basicConfig(level=logging.INFO)

def handler(event, context):
    """
    Cloud Function entrypoint.
    """
    logging.info("Function triggered.")
    
    try:
        # Initialize provider (using placeholder credentials for now)
        # In production, these would come from Secret Manager
        api_credentials = {"token": "placeholder_token"}
        calendar_provider = GoogleCalendarProvider(api_credentials)
        
        # Initialize agent
        agent = MorningBriefingAgent(calendar_provider)
        
        # Define time range (e.g., today)
        now = datetime.datetime.utcnow()
        end = now + datetime.timedelta(days=1)
        
        # Get briefing
        briefing = agent.get_briefing(now, end)
        logging.info(f"Briefing generated: {briefing}")
        
        return briefing
        
    except Exception as e:
        logging.error(f"Error executing function: {e}")
        raise e

if __name__ == "__main__":
    # Local test execution
    class MockContext:
        pass
    handler(None, MockContext())
