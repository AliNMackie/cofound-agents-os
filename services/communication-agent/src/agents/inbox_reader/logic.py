from typing import Any

from opentelemetry import trace

from src.shared.idempotency import IdempotencyGuard
from src.shared.interfaces import MailProvider
from src.shared.schema import AgentOutput, EmailTask, Status

tracer = trace.get_tracer(__name__)

class InboxAgent:
    def __init__(
        self,
        mail_provider: MailProvider,
        vertex_model: Any,  # Should be vertexai.generative_models.GenerativeModel
        idempotency_guard: IdempotencyGuard,
    ):
        """
        Initializes the InboxAgent.

        Args:
            mail_provider: An implementation of the MailProvider interface.
            vertex_model: An authenticated Vertex AI model resource.
            idempotency_guard: An instance of IdempotencyGuard.
        """
        self._mail_provider = mail_provider
        self._vertex_model = vertex_model
        self._idempotency_guard = idempotency_guard

    def process_email(self, email_task: EmailTask) -> AgentOutput:
        """
        Processes an email task: checks idempotency, generates a draft, and creates it via the provider.

        Args:
            email_task: The email task to process.

        Returns:
            An AgentOutput indicating the result of the operation.
        """
        with tracer.start_as_current_span("process_email") as span:
            # Log metadata only, respecting privacy rules
            span.set_attribute("email.id", email_task.email_id)
            span.set_attribute("email.thread_id", email_task.thread_id)
            span.set_attribute("email.sender", email_task.sender)

            # 1. Idempotency Check
            if not self._idempotency_guard.check_and_lock(email_task.email_id):
                span.add_event("Idempotency check failed: email already processed.")
                return AgentOutput(status=Status.SKIPPED)

            try:
                # 2. Call Vertex AI to summarize and draft a reply
                with tracer.start_as_current_span("generate_draft_content") as gen_span:
                    # The prompt is simplified for this example.
                    prompt = f"Summarize this email and draft a professional reply to the sender:\n\n---\n\n{email_task.body}"
                    
                    # NOTE: Per privacy rules, the email body itself is not logged.
                    # The call to the model is traced, but not the content.
                    response = self._vertex_model.generate_content(prompt)
                    draft_content = response.text
                    gen_span.set_attribute("draft.char_length", len(draft_content))

                # 3. Spam Check
                if "[SPAM]" in draft_content:
                    span.add_event("Spam detected; skipping draft creation.")
                    return AgentOutput(status=Status.SKIPPED)

                # 4. Create a draft using the mail provider
                with tracer.start_as_current_span("create_draft") as draft_span:
                    # A more robust implementation would parse the original subject.
                    subject = "Re: Your recent email"
                    
                    draft_id = self._mail_provider.create_draft(
                        recipient=email_task.sender,
                        subject=subject,
                        body=draft_content
                    )
                    
                    draft_span.set_attribute("draft.id", draft_id)

                return AgentOutput(status=Status.SUCCESS, draft_id=draft_id)

            except Exception as e:
                span.record_exception(e)
                span.set_status(trace.Status(trace.StatusCode.ERROR, str(e)))
                return AgentOutput(status=Status.FAILURE)
