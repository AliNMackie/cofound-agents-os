import os
import json
import traceback

# Try imports and print errors if they fail
try:
    import requests
    from bs4 import BeautifulSoup
    from google.cloud import pubsub_v1
except ImportError as e:
    print(f"CRITICAL IMPORT ERROR: {e}")

def ingest_content(request):
    # 1. CORS Headers
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '3600'
    }

    # 2. Handle Preflight
    if request.method == 'OPTIONS':
        return ('', 204, headers)

    try:
        # 3. Load & Check Env Vars
        project_id = os.environ.get("PROJECT_ID")
        topic_id = os.environ.get("TOPIC_ID")

        if not project_id or not topic_id:
            print(f"CONFIG ERROR: Env Vars missing. Project: {project_id}, Topic: {topic_id}")
            return ("Configuration Error: Missing Environment Variables", 500, headers)

        # 4. Parse Request
        request_json = request.get_json(silent=True)
        if not request_json or 'client_id' not in request_json:
            return ('Missing client_id', 400, headers)

        # 5. Logic: Scrape URL if needed
        if request_json.get('url') and not request_json.get('content'):
            try:
                resp = requests.get(request_json['url'], headers={'User-Agent': 'NewsletterBot/1.0'}, timeout=10)
                soup = BeautifulSoup(resp.content, 'html.parser')
                article = soup.find('article') or soup.find('main') or soup.body
                request_json['content'] = article.get_text(strip=True)[:15000] if article else ""
            except Exception as e:
                print(f"SCRAPE ERROR: {e}")

        # 6. Publish to Pub/Sub
        publisher = pubsub_v1.PublisherClient(transport="rest")
        topic_path = publisher.topic_path(project_id, topic_id)
        data = json.dumps(request_json).encode("utf-8")
        future = publisher.publish(topic_path, data)
        message_id = future.result(timeout=10)
        
        return (f"Queued message {message_id}", 200, headers)

    except Exception as e:
        # This catches the crash and prints it to logs
        print(f"RUNTIME CRASH: {str(e)}")
        print(traceback.format_exc())
        return (f"Internal Server Error: {str(e)}", 500, headers)