"""
Test script to validate Outlook provider structure and imports.
This doesn't require actual credentials - just validates the code structure.
"""
import sys
from unittest.mock import MagicMock, patch

def test_outlook_provider_structure():
    """Test that OutlookProvider can be instantiated and has required methods."""
    print("Testing OutlookProvider structure...")
    
    try:
        from src.providers.outlook import OutlookProvider
        print("✓ OutlookProvider imported successfully")
    except Exception as e:
        print(f"✗ Failed to import OutlookProvider: {e}")
        return False
    
    # Mock MSAL to avoid actual authentication
    with patch('src.providers.outlook.msal.ConfidentialClientApplication'):
        try:
            provider = OutlookProvider(
                client_id="test-client-id",
                client_secret="test-secret",
                tenant_id="test-tenant",
                target_user_email="test@example.com"
            )
            print("✓ OutlookProvider instantiated successfully")
        except Exception as e:
            print(f"✗ Failed to instantiate OutlookProvider: {e}")
            return False
    
    # Check for required methods
    if hasattr(provider, 'fetch_unread'):
        print("✓ fetch_unread method exists")
    else:
        print("✗ fetch_unread method not found")
        return False
    
    if hasattr(provider, 'create_draft'):
        print("✓ create_draft method exists")
    else:
        print("✗ create_draft method not found")
        return False
    
    if hasattr(provider, '_get_headers'):
        print("✓ _get_headers helper method exists")
    else:
        print("✗ _get_headers helper method not found")
        return False
    
    if hasattr(provider, '_parse_messages'):
        print("✓ _parse_messages helper method exists")
    else:
        print("✗ _parse_messages helper method not found")
        return False
    
    print("\n✓ All structural checks passed!")
    return True

def test_msal_import():
    """Test that MSAL library can be imported."""
    print("\nTesting MSAL import...")
    
    try:
        import msal
        print("✓ msal library imported successfully")
        print(f"  Version: {msal.__version__ if hasattr(msal, '__version__') else 'unknown'}")
        return True
    except ImportError as e:
        print(f"✗ Failed to import msal: {e}")
        print("  Run: pip install msal")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("Outlook Provider - Structural Validation")
    print("=" * 60)
    print()
    
    # Test MSAL import first
    msal_ok = test_msal_import()
    
    # Test Outlook provider structure
    outlook_ok = test_outlook_provider_structure()
    
    print("\n" + "=" * 60)
    if msal_ok and outlook_ok:
        print("✓ ALL TESTS PASSED - Outlook provider structure is valid!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("✗ SOME TESTS FAILED - Please review errors above")
        print("=" * 60)
        sys.exit(1)
