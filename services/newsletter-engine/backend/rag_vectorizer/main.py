import base64
import json
import os
import vertexai
from vertexai.language_models import TextEmbeddingModel

def process_pubsub(event, context):
    """
    Triggered by Pub/Sub.
    Generates embeddings.
    """
    # MOVE INIT HERE: Lazy load to prevent deployment crashes
    print("Initializing Vertex AI...")
    vertexai.init(project=os.environ["PROJECT_ID"], location="europe-west2")
    model = TextEmbeddingModel.from_pretrained("text-embedding-004")

    if 'data' in event:
        try:
            payload = base64.b64decode(event['data']).decode('utf-8')
            data = json.loads(payload)
            
            text_content = data.get('content', '')
            client_id = data.get('client_id')
            
            if text_content:
                # Create Embedding
                embeddings = model.get_embeddings([text_content])
                vector = embeddings[0].values
                print(f"Generated vector for Client {client_id}. Dimensions: {len(vector)}")
                # Future: Upsert 'vector' to Vertex AI Index Endpoint here
        except Exception as e:
            print(f"Error processing message: {e}")
            raise e
        
    return "Processed"
