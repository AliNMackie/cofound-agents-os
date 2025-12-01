class CalendarProviderError(Exception):
    """Base exception for calendar provider errors."""
    pass

class TokenExpired(CalendarProviderError):
    """Raised when an API token has expired."""
    pass

class QuotaExceeded(CalendarProviderError):
    """Raised when the API quota has been exceeded."""
    pass
