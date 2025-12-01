from functools import wraps
import logging
from requests import HTTPError
from tenacity import retry, stop_after_attempt, wait_exponential
from src.shared.exceptions import QuotaExceeded, TokenExpired

def handle_provider_errors(func):
    """
    A decorator to handle common provider API errors.
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except QuotaExceeded:
            return [] # Graceful degradation
        except TokenExpired:
            raise # Re-raise to be handled by the worker
    return wrapper

def provider_retry(func):
    """
    A decorator to handle retries for provider API calls.
    """
    @wraps(func)
    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=10),
        retry=lambda e: isinstance(e, HTTPError) and e.response.status_code >= 500,
        before_sleep=lambda retry_state: logging.warning(f"Server error. Retrying in {retry_state.next_action.sleep} seconds...")
    )
    def wrapper(*args, **kwargs):
        return func(*args, **kwargs)
    return wrapper
