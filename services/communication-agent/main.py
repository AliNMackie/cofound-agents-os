"""
Dispatcher Cloud Function.

This function acts as a cron job trigger. It queries Firestore for users
who are due for an inbox check, and dispatches a task to the Worker function
via Cloud Tasks for each eligible user.
"""
import os
import json
import functions_framework
from datetime import datetime, timedelta
from google.cloud import firestore
from google.cloud import tasks_v2

# Configuration
PROJECT_ID = os.environ.get('PROJECT_ID')
LOCATION = os.environ.get('LOCATION', 'us-central1')
TASK_QUEUE_NAME = os.environ.get('TASK_QUEUE_NAME', 'email-processing-queue')
WORKER_FUNCTION_URL = os.environ.get('WORKER_FUNCTION_URL')


@functions_framework.http
def handler(request):
    """
    Dispatcher entry point.
    
    Triggered by Cloud Scheduler (e.g., every 5 minutes).
    """
    if not all([PROJECT_ID, WORKER_FUNCTION_URL]):
        return {'error': 'Missing configuration'}, 500, {'Content-Type': 'application/json'}

    # Initialize clients
    firestore_client = firestore.Client(project=PROJECT_ID)
    tasks_client = tasks_v2.CloudTasksClient()
    
    # Construct queue path
    parent = tasks_client.queue_path(PROJECT_ID, LOCATION, TASK_QUEUE_NAME)
    
    # Query for users due for check
    now = datetime.utcnow()
    users_ref = firestore_client.collection('users')
    
    # Query: is_active == True AND next_check_time <= now
    # Note: Requires composite index in Firestore
    query = users_ref.where('is_active', '==', True)\
                     .where('next_check_time', '<=', now)
    
    results = {
        'dispatched': 0,
        'errors': 0,
        'details': []
    }
    
    try:
        docs = list(query.stream())
        
        for doc in docs:
            user_data = doc.to_dict()
            user_id = doc.id
            
            try:
                # 1. Create Cloud Task
                task = {
                    'http_request': {
                        'http_method': tasks_v2.HttpMethod.POST,
                        'url': WORKER_FUNCTION_URL,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'user_id': user_id}).encode()
                    }
                }
                
                # Add OIDC token for authentication if needed
                # task['http_request']['oidc_token'] = {'service_account_email': ...}
                
                tasks_client.create_task(parent=parent, task=task)
                
                # 2. Update next_check_time
                interval = user_data.get('check_interval_minutes', 15)
                next_check = now + timedelta(minutes=interval)
                
                users_ref.document(user_id).update({
                    'next_check_time': next_check,
                    'last_check_dispatched_at': firestore.SERVER_TIMESTAMP
                })
                
                results['dispatched'] += 1
                results['details'].append(f"Dispatched user {user_id}")
                
            except Exception as e:
                print(f"Error dispatching user {user_id}: {e}")
                results['errors'] += 1
                results['details'].append(f"Failed user {user_id}: {str(e)}")
                
        return results, 200, {'Content-Type': 'application/json'}
        
    except Exception as e:
        print(f"Dispatcher error: {e}")
        return {'error': str(e)}, 500, {'Content-Type': 'application/json'}
