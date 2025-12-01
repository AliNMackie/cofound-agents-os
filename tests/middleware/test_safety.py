import pytest
from src.middleware.safety import redact_pii

def test_redact_pii_email():
    """Tests that email addresses are redacted."""
    text = "My email is test@example.com."
    redacted = redact_pii(text)
    assert "test@example.com" not in redacted
    assert "<EMAIL_ADDRESS>" in redacted

def test_redact_pii_phone():
    """Tests that phone numbers are redacted."""
    text = "Call me at 555-123-4567."
    redacted = redact_pii(text)
    assert "555-123-4567" not in redacted
    assert "<PHONE_NUMBER>" in redacted

def test_redact_pii_mixed():
    """Tests that both email and phone numbers are redacted."""
    text = "Contact me at test@example.com or 555-123-4567."
    redacted = redact_pii(text)
    assert "test@example.com" not in redacted
    assert "555-123-4567" not in redacted
    assert "<EMAIL_ADDRESS>" in redacted
    assert "<PHONE_NUMBER>" in redacted

def test_redact_pii_no_pii():
    """Tests that the text is unchanged if no PII is present."""
    text = "This is a safe sentence."
    redacted = redact_pii(text)
    assert text == redacted
