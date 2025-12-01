import unittest
from unittest.mock import MagicMock, Mock

from google.cloud import firestore

from src.agents.inbox_reader.logic import InboxAgent
from src.shared.idempotency import IdempotencyGuard
from src.shared.interfaces import MailProvider
from src.shared.schema import EmailTask, Status


class TestInboxAgent(unittest.TestCase):
    def setUp(self):
        """Set up the test environment before each test."""
        # Mock external dependencies
        self.mock_mail_provider = MagicMock(spec=MailProvider)
        self.mock_vertex_model = MagicMock()

        # We need a mock for the Firestore client and the IdempotencyGuard
        # In a real-world scenario, you might use an in-memory Firestore emulator
        mock_firestore_client = MagicMock(spec=firestore.Client)
        self.mock_idempotency_guard = IdempotencyGuard(
            firestore_client=mock_firestore_client
        )
        # For testing, we can directly mock the `check_and_lock` method
        self.mock_idempotency_guard.check_and_lock = MagicMock(return_value=True)

        # Instantiate the agent with mocked dependencies
        self.agent = InboxAgent(
            mail_provider=self.mock_mail_provider,
            vertex_model=self.mock_vertex_model,
            idempotency_guard=self.mock_idempotency_guard,
        )

    def test_spam_filtering(self):
        """Test that the agent correctly identifies and skips spam emails."""
        # Arrange: Create a synthetic spam email task
        spam_email_task = EmailTask(
            email_id="spam-email-123",
            thread_id="thread-abc",
            body="This is a spam email.",
            sender="spammer@example.com",
        )

        # Mock the Vertex AI response to indicate spam
        mock_response = Mock()
        mock_response.text = "[SPAM] This is a spam response."
        self.mock_vertex_model.generate_content.return_value = mock_response

        # Act: Process the spam email
        result = self.agent.process_email(spam_email_task)

        # Assert:
        # 1. The idempotency guard was checked.
        self.mock_idempotency_guard.check_and_lock.assert_called_once_with(
            "spam-email-123"
        )
        # 2. The Vertex AI model was called.
        self.mock_vertex_model.generate_content.assert_called_once()
        # 3. The mail provider draft creation was NOT called.
        self.mock_mail_provider.create_draft.assert_not_called()
        # 4. The final status is SKIPPED.
        self.assertEqual(result.status, Status.SKIPPED)

    def test_vip_client_email_processing(self):
        """Test that the agent correctly processes a legitimate client email."""
        # Arrange: Create a synthetic client email task
        client_email_task = EmailTask(
            email_id="vip-client-456",
            thread_id="thread-def",
            body="This is an important client email.",
            sender="vip.client@example.com",
        )

        # Mock the Vertex AI response for a legitimate email
        mock_response = Mock()
        mock_response.text = "This is a legitimate draft reply."
        self.mock_vertex_model.generate_content.return_value = mock_response

        # Mock the mail provider draft creation response
        self.mock_mail_provider.create_draft.return_value = "draft-xyz-789"

        # Act: Process the client email
        result = self.agent.process_email(client_email_task)

        # Assert:
        # 1. The idempotency guard was checked.
        self.mock_idempotency_guard.check_and_lock.assert_called_once_with(
            "vip-client-456"
        )
        # 2. The Vertex AI model was called.
        self.mock_vertex_model.generate_content.assert_called_once()
        # 3. The mail provider draft creation WAS called.
        self.mock_mail_provider.create_draft.assert_called_once_with(
            recipient="vip.client@example.com",
            subject="Re: Your recent email",
            body="This is a legitimate draft reply."
        )
        # 4. The final status is SUCCESS.
        self.assertEqual(result.status, Status.SUCCESS)
        # 5. The draft ID is correctly returned.
        self.assertEqual(result.draft_id, "draft-xyz-789")


if __name__ == "__main__":
    unittest.main()

