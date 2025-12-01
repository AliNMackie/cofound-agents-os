import os
import sqlalchemy
from google.cloud import firestore

# Global variable to hold the connection (initially None)
pool = None

def get_db_connection():
    """
    Creates the DB connection only when needed (Lazy Loading).
    Prevents deployment crashes by not connecting at startup.
    """
    global pool
    if pool is None:
        db_user = os.environ["DB_USER"]
        db_pass = os.environ["DB_PASS"]
        db_name = os.environ["DB_NAME"]
        db_socket_dir = os.environ.get("DB_SOCKET_DIR", "/cloudsql")
        cloud_sql_connection_name = os.environ["CLOUD_SQL_CONNECTION_NAME"]

        pool = sqlalchemy.create_engine(
            sqlalchemy.engine.url.URL.create(
                drivername="postgresql+pg8000",
                username=db_user,
                password=db_pass,
                database=db_name,
                query={"unix_sock": f"{db_socket_dir}/{cloud_sql_connection_name}/.s.PGSQL.5432"}
            )
        )
    return pool

def check_hot_topics(event, context):
    """
    Triggered by Cloud Scheduler (CRON) via Pub/Sub.
    """
    print("Starting Watchdog run...")
    try:
        # Initialize DB connection here, inside the function
        db = get_db_connection()
        
        with db.connect() as conn:
            stmt = sqlalchemy.text("SELECT id, hot_topics FROM clients WHERE hot_topics IS NOT NULL")
            clients = conn.execute(stmt).fetchall()
            
            if not clients:
                print("No clients with hot topics found.")
            
            for client in clients:
                print(f"Scanning client {client[0]} for topics: {client[1]}")
            
        return "Watchdog Run Complete"
    except Exception as e:
        print(f"CRITICAL WATCHDOG ERROR: {e}")
        return f"Error: {e}"