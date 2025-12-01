"""
Simple test script to verify the main.py imports and basic structure.
This doesn't require GCP credentials - just validates the code structure.
"""
import sys
import importlib.util

def test_main_module():
    """Test that main.py can be imported and has the required handler function."""
    print("Testing main.py module...")
    
    # Load the main module
    spec = importlib.util.spec_from_file_location("main", "main.py")
    main_module = importlib.util.module_from_spec(spec)
    
    try:
        spec.loader.exec_module(main_module)
        print("✓ main.py loaded successfully")
    except Exception as e:
        print(f"✗ Failed to load main.py: {e}")
        return False
    
    # Check for handler function
    if hasattr(main_module, 'handler'):
        print("✓ handler function exists")
    else:
        print("✗ handler function not found")
        return False
    
    # Check if handler is callable
    if callable(main_module.handler):
        print("✓ handler is callable")
    else:
        print("✗ handler is not callable")
        return False
    
    print("\n✓ All structural checks passed!")
    return True

def test_package_imports():
    """Test that all package imports work correctly."""
    print("\nTesting package imports...")
    
    try:
        from src.agents.inbox_reader.logic import InboxAgent
        print("✓ InboxAgent imported successfully")
    except Exception as e:
        print(f"✗ Failed to import InboxAgent: {e}")
        return False
    
    try:
        from src.shared.idempotency import IdempotencyGuard
        print("✓ IdempotencyGuard imported successfully")
    except Exception as e:
        print(f"✗ Failed to import IdempotencyGuard: {e}")
        return False
    
    try:
        from src.shared.schema import EmailTask, AgentOutput, Status
        print("✓ Schema classes imported successfully")
    except Exception as e:
        print(f"✗ Failed to import schema classes: {e}")
        return False
    
    print("\n✓ All imports successful!")
    return True

if __name__ == "__main__":
    print("=" * 60)
    print("Communication Agent - Structural Validation")
    print("=" * 60)
    print()
    
    # Test package imports first
    imports_ok = test_package_imports()
    
    # Test main module
    main_ok = test_main_module()
    
    print("\n" + "=" * 60)
    if imports_ok and main_ok:
        print("✓ ALL TESTS PASSED - Application structure is valid!")
        print("=" * 60)
        sys.exit(0)
    else:
        print("✗ SOME TESTS FAILED - Please review errors above")
        print("=" * 60)
        sys.exit(1)
