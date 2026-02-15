
import sys
from unittest.mock import MagicMock, AsyncMock

# MOCK WEASYPRINT
weasy_mock = MagicMock()
sys.modules["weasyprint"] = weasy_mock
weasy_mock.HTML.return_value.write_pdf.return_value = b"FAKE PDF BYTES"

import os
sys.path.append(os.path.join(os.getcwd(), "services", "sentinel-growth"))

# MOCK STORAGE BEFORE IMPORT
storage_mock = MagicMock()
sys.modules["src.services.storage"] = storage_service_mock_module = MagicMock()
# We need to ensure when memo_service imports it, it gets our mock
# But memo_service does: from src.services.storage import storage_service
# So our mock module must have storage_service attribute
storage_service_mock_module.storage_service = MagicMock()
storage_service_mock_module.storage_service.upload_and_sign.return_value = "https://fake-url.com/briefing.pdf"

import asyncio
from src.services.memo_service import memo_service

# We don't need to patch memo_service.storage_service anymore if import worked correctly
# but let's leave it or remove it.
# memo_service.storage_service = MagicMock() <- This line in previous file might be too late if module already loaded


# Mock ContentGenerator
from src.services.content import ContentGenerator
ContentGenerator.generate_section = MagicMock()
ContentGenerator.generate_section.return_value = MagicMock(content="# Executive Summary\n\nMarket is crashing.")

async def verify_memo_generation():
    pulse_data = {
        "date": "2023-10-27",
        "signals": [
            {"company_name": "TestCo", "headline": "Bankruptcy", "signal_type": "RESCUE", "source_family": "RSS"}
        ]
    }
    
    print("Generating briefing...")
    url = await memo_service.generate_morning_briefing(pulse_data)
    
    print(f"Generated URL: {url}")
    assert url == "https://fake-url.com/briefing.pdf"
    print("SUCCESS: Memo Service Verified")

if __name__ == "__main__":
    asyncio.run(verify_memo_generation())
