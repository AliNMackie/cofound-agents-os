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
            
            # Times
            now = datetime.datetime.utcnow()
            expiration_minutes = 15
            
            # V4 Signing Elements
            request_timestamp = now.strftime('%Y%m%dT%H%M%SZ')
            datestamp = now.strftime('%Y%m%d')
            credential_scope = f"{datestamp}/auto/storage/goog4_request"
            credential_value = f"{service_account_email}/{credential_scope}"
            
            canonical_uri = f"/{self.bucket_name}/{filename}"
            
            # Canonical Query String - MUST be sorted by key
            # X-Goog-Date must be the REQUEST timestamp, not expiration
            query_params = {
                "X-Goog-Algorithm": "GOOG4-RSA-SHA256",
                "X-Goog-Credential": credential_value,
                "X-Goog-Date": request_timestamp,
                "X-Goog-Expires": str(expiration_minutes * 60),
                "X-Goog-SignedHeaders": "host"
            }
            
            # Sort and encode params
            # quote(v, safe='') is critical for the Credential which contains slashes
            sorted_query = sorted(query_params.items())
            canonical_query_string = "&".join(
                f"{k}={quote(v, safe='')}" for k, v in sorted_query
            )
            
            # Canonical Request
            canonical_request = f"GET\n{canonical_uri}\n{canonical_query_string}\nhost:storage.googleapis.com\n\nhost\nUNSIGNED-PAYLOAD"
            
            # String to Sign
            algorithm = "GOOG4-RSA-SHA256"
            hashed_canonical_request = hashlib.sha256(canonical_request.encode()).hexdigest()
            string_to_sign = f"{algorithm}\n{request_timestamp}\n{credential_scope}\n{hashed_canonical_request}"
            
            # Sign with IAM
            iam_client = iam_credentials_v1.IAMCredentialsClient(credentials=credentials)
            service_account_path = f"projects/-/serviceAccounts/{service_account_email}"
            
            response = iam_client.sign_blob(
                name=service_account_path,
                payload=string_to_sign.encode()
            )
            
            signature = response.signed_blob.hex()
            
            # Construct final URL
            url = f"https://storage.googleapis.com{canonical_uri}?{canonical_query_string}&X-Goog-Signature={signature}"
            
            logger.info("Generated signed URL", filename=filename)
            return url
        except Exception as e:
            logger.error("Failed to upload and sign file", filename=filename, error=str(e))
            raise e

storage_service = StorageService()
