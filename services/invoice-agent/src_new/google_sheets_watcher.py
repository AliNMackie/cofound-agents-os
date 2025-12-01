import time
import warnings

def watch_sheets():
    # Deprecation warning to prevent "Ghost Invoices"
    warnings.warn(
        "Pull-based sheet watching is deprecated. Use the Push API (/api/v1/finance/ingest-batch) instead.",
        DeprecationWarning,
        stacklevel=2
    )
    print("Watching Google Sheets...")
    while True:
        time.sleep(10)
