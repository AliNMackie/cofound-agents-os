import datetime
import structlog
from google.cloud import firestore
from src.core.config import settings
from src.services.slack_notifier import slack_notifier

logger = structlog.get_logger()

class PulseEngine:
    """
    Orchestrates the Morning Pulse generation by identifying high-conviction signals.
    """
    def __init__(self):
        self.db = firestore.Client(database=settings.FIRESTORE_DB_NAME)
        self.signals_col = "auctions"
        self.pulses_col = "morning_pulses"

    async def generate_morning_pulse(self):
        """
        Compiles the top 5 signals by conviction score and recency.
        Saves the pulse document for the day.
        """
        try:
            logger.info("Generating Morning Pulse...")
            
            # 1. Fetch top 5 signals from the last 24 hours
            cutoff_date = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
            
            query = self.db.collection(self.signals_col)\
                .where("ingested_at", ">=", cutoff_date)\
                .order_by("conviction_score", direction=firestore.Query.DESCENDING)\
                .order_by("ingested_at", direction=firestore.Query.DESCENDING)\
                .limit(5)
            
            docs = query.stream()
            top_signals = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                top_signals.append(data)
            
            if not top_signals:
                logger.info("No new high-conviction signals found for the Morning Pulse.")
                return None

            # 2. Create the Pulse Document
            pulse_id = datetime.datetime.now().strftime("%Y-%m-%d")
            pulse_data = {
                "date": pulse_id,
                "generated_at": datetime.datetime.now(datetime.timezone.utc),
                "signals": top_signals,
                "status": "READY",
                "summary": f"Morning Pulse for {pulse_id} identifies {len(top_signals)} high-conviction targets."
            }
            
            self.db.collection(self.pulses_col).document(pulse_id).set(pulse_data)
            
            # 3. Trigger Slack Alert (Push Intelligence)
            await slack_notifier.send_pulse_alert(pulse_data)
            
            logger.info("Morning Pulse generated and alert sent", pulse_id=pulse_id, count=len(top_signals))
            return pulse_id

        except Exception as e:
            logger.error("Failed to generate Morning Pulse", error=str(e))
            raise e

pulse_engine = PulseEngine()
