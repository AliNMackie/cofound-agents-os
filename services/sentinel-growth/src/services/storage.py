import datetime
import structlog
from google.cloud import storage
from src.core.config import settings

logger = structlog.get_logger()

class StorageService:
    def __init__(self):
        try:
            # If credentials are not explicitly set in env, it will try to find default credentials
            self.client = storage.Client()
            self.bucket_name = settings.GCS_BUCKET_NAME
            logger.info("StorageService initialized", bucket=self.bucket_name)
        except Exception as e:
            logger.error("Failed to initialize StorageService", error=str(e))
            self.client = None

    def upload_and_sign(self, file_bytes: bytes, filename: str, content_type: str) -> str:
        """
        Uploads a file to GCS and returns a V4 signed URL valid for 15 minutes.
        Uses IAM signBlob API to work with Cloud Run's workload identity.
        """
        if not self.client:
            raise RuntimeError("StorageService is not initialized properly")

        try:
            bucket = self.client.bucket(self.bucket_name)
            blob = bucket.blob(filename)
            
            # Upload file
            logger.info("Uploading file", filename=filename, content_type=content_type)
            blob.upload_from_string(file_bytes, content_type=content_type)
            
            # Generate Signed URL manually using IAM signBlob
            import google.auth
            from google.auth.transport import requests as auth_requests
            from google.cloud import iam_credentials_v1
            import base64
            import hashlib
            from urllib.parse import quote
            
            # Get default credentials
            credentials, project = google.auth.default()
            auth_req = auth_requests.Request()
            credentials.refresh(auth_req)
            
            # Get service account email
            if hasattr(credentials, 'service_account_email'):
                service_account_email = credentials.service_account_email
            else:
                # Fallback: get from metadata server
                import requests
                metadata_url = "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/email"
                headers = {"Metadata-Flavor": "Google"}
                service_account_email = requests.get(metadata_url, headers=headers).text
            
            # Build the canonical request for signing
            expiration = datetime.datetime.now() + datetime.timedelta(minutes=15)
            expiration_timestamp = int(expiration.timestamp())
            
            canonical_uri = f"/{self.bucket_name}/{filename}"
            canonical_query_string = f"X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential={quote(service_account_email)}/{expiration.strftime('%Y%m%d')}/auto/storage/goog4_request&X-Goog-Date={expiration.strftime('%Y%m%dT%H%M%SZ')}&X-Goog-Expires=900&X-Goog-SignedHeaders=host"
            
            canonical_request = f"GET\n{canonical_uri}\n{canonical_query_string}\nhost:storage.googleapis.com\n\nhost\nUNSIGNED-PAYLOAD"
            
            string_to_sign = f"GOOG4-RSA-SHA256\n{expiration.strftime('%Y%m%dT%H%M%SZ')}\n{expiration.strftime('%Y%m%d')}/auto/storage/goog4_request\n{hashlib.sha256(canonical_request.encode()).hexdigest()}"
            
            # Use IAM API to sign
            iam_client = iam_credentials_v1.IAMCredentialsClient(credentials=credentials)
            service_account_path = f"projects/-/serviceAccounts/{service_account_email}"
            
            response = iam_client.sign_blob(
                name=service_account_path,
                payload=string_to_sign.encode()
            )
            
            signature = base64.b64encode(response.signed_blob).decode()
            
            url = f"https://storage.googleapis.com{canonical_uri}?{canonical_query_string}&X-Goog-Signature={quote(signature)}"
            
            logger.info("Generated signed URL", filename=filename)
            return url
        except Exception as e:
            logger.error("Failed to upload and sign file", filename=filename, error=str(e))
            raise e

storage_service = StorageService()
