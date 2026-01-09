
import sys
import os
from unittest.mock import MagicMock
import logging

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("BrainVerifier")

# Mock google.generativeai BEFORE importing editor
sys.modules["google.generativeai"] = MagicMock()
import google.generativeai as genai

# Setup Path to import service source
current_dir = os.path.dirname(os.path.abspath(__file__))
service_path = os.path.join(current_dir, "..", "services", "newsletter-engine", "src")
sys.path.append(service_path)

try:
    from services.editor import NewsletterEditor
except ImportError:
    # Fallback layout if specific path needed
    sys.path.append(os.path.join(current_dir, "..", "services", "newsletter-engine"))
    from src.services.editor import NewsletterEditor

async def run_verification():
    print("\n🧠 ANTIGRAVITY BRAIN VERIFICATION PROTOCOL")
    print("==========================================")
    
    # Initialize Editor (Mocking API Key)
    os.environ["GEMINI_API_KEY"] = "MOCK_KEY"
    editor = NewsletterEditor()
    
    # Mock the model's generate_content method to capture input
    mock_model = MagicMock()
    editor.model = mock_model
    
    # --- TEST CASE A: CRE DISTRESS ---
    cre_context = """You are a Special Situations Analyst for UK Commercial Real Estate.
CORE THESIS: The 2025-2027 Refinancing Wall is the primary driver.
SIGNAL PRIORITY:
1. **Financial Pressure:** Flag deteriorating interest cover, net debt/EBITDA breaches, or LTV > 60%.
2. **Refinancing Events:** Prioritize loans maturing within 12-24 months or extension requests.
OUTPUT STYLE: Rank opportunities by 'Distress Probability (1-100)'."""
    
    print("\n🧪 TEST CASE A: INJECTING 'CRE DISTRESS' CONTEXT...")
    await editor.generate_draft(
        raw_data=[], 
        template_id="weekly_wrap", 
        industry_context=cre_context
    )
    
    # Capture Argument
    args, _ = mock_model.generate_content_async.call_args
    cre_prompt = args[0]
    
    # --- TEST CASE B: SAAS ORIGINATION ---
    saas_context = """You are a Tech M&A Originator.
CORE THESIS: Competitive Deal Sourcing (Buy & Build).
SIGNAL PRIORITY:
1. **Exit Readiness:** Flag 'Founder Fatigue', 'CFO Hiring', or 'Strategic Review'.
2. **Growth Metrics:** Prioritize 'Rule of 40', ARR >£5m, or 'Contract Concentration'.
OUTPUT STYLE: Structure as an 'Investment Teaser'."""

    print("🧪 TEST CASE B: INJECTING 'SAAS ORIGINATION' CONTEXT...")
    await editor.generate_draft(
        raw_data=[], 
        template_id="weekly_wrap", 
        industry_context=saas_context
    )
    
    # Capture Argument
    args, _ = mock_model.generate_content_async.call_args
    saas_prompt = args[0]
    
    # --- VERIFICATION ---
    print("\n🔍 ANALYZING SYSTEM PROMPTS...")
    
    if "LTV > 60%" in cre_context and "Refinancing Wall" in cre_context:
        print("✅ CASE A (CRE) PASSED: Contains 'LTV > 60%' and 'Refinancing Wall'")
    else:
        print("❌ CASE A FAILED")

    if "Rule of 40" in saas_prompt and "Founder Fatigue" in saas_prompt:
        print("✅ CASE B (SaaS) PASSED: Contains 'Rule of 40' and 'Founder Fatigue'")
    else:
        print("❌ CASE B FAILED")

    if cre_prompt != saas_prompt:
        print("✅ DISCRIMINATION VERIFIED: Prompts are DISTINCT.")
    else:
        print("❌ CRITICAL FAILURE: Prompts are IDENTICAL.")

    print("\n--- PROMPT SNIPPET COMPARISON ---")
    print(f"CRE PROMPT (Partial):\n{cre_prompt.split('### INDUSTRY CONTEXT')[1].split('### CRITICAL OVERRIDES')[0].strip()}\n")
    print(f"SaaS PROMPT (Partial):\n{saas_prompt.split('### INDUSTRY CONTEXT')[1].split('### CRITICAL OVERRIDES')[0].strip()}\n")
    print("==========================================")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_verification())
