from google.cloud import firestore
from google.api_core.exceptions import AlreadyExists

class IdempotencyGuard:
    def __init__(self, firestore_client: firestore.Client, collection_name: str = "email_locks"):
        self._client = firestore_client
        self._collection = self._client.collection(collection_name)

    def check_and_lock(self, email_id: str) -> bool:
        """
        Checks for the existence of a document and creates it transactionally if it does not exist.

        Args:
            email_id: The unique identifier for the email.

        Returns:
            True if the lock was acquired, False if it already existed.
        """
        doc_ref = self._collection.document(email_id)
        transaction = self._client.transaction()

        @firestore.transactional
        def _transactional_create(transaction, doc_ref):
            snapshot = doc_ref.get(transaction=transaction)
            if snapshot.exists:
                return False
            else:
                transaction.create(doc_ref, {"locked_at": firestore.SERVER_TIMESTAMP})
                return True

        return _transactional_create(transaction, doc_ref)
