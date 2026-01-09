import os
import io
import google.generativeai as genai
from google.cloud import firestore
from fastapi import UploadFile
import pypdf
from typing import Optional, Dict, Any

class StyleAnalyzer:
    def __init__(self):
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            print("Warning: GOOGLE_API_KEY not set")
        else:
            genai.configure(api_key=api_key)
            # USAGE: "gemini-3-pro-preview" for advanced vibe-coding
<<<<<<< HEAD
            self.model = genai.GenerativeModel('gemini-3-flash-preview') # Updated to 3-flash-preview
=======
            self.model = genai.GenerativeModel('gemini-3-flash-preview') # Fallback to 1.5-pro if 3 not available in lib yet, but aiming for 3 capabilities via system prompt structure
>>>>>>> feature/saas-refactor
            # Ideally: self.model = genai.GenerativeModel('gemini-3-pro-preview')
        
        # Initialize Firestore
        # Assuming GOOGLE_APPLICATION_CREDENTIALS is set or running in GCP environment
        try:
            self.db = firestore.Client()
        except Exception as e:
            print(f"Warning: Firestore failed to initialize: {e}")
            self.db = None

    async def extract_from_file(self, file: UploadFile) -> str:
        """
        Extracts text from an uploaded PDF or Text file.
        """
        content = await file.read()
        
        if file.content_type == "application/pdf":
            try:
                pdf_file = io.BytesIO(content)
                reader = pypdf.PdfReader(pdf_file)
                text = ""
                for page in reader.pages:
                    text += page.extract_text() + "\n"
                return text
            except Exception as e:
                raise ValueError(f"Failed to process PDF: {str(e)}")
        else:
            # Assume text/plain or markdown
            return content.decode("utf-8")

    async def analyze_voice(self, text: str) -> Dict[str, str]:
        """
        Analyzes the text using Gemini to extract 'Voice DNA'.
        """
        if not hasattr(self, 'model'):
            return {"error": "AI Model not configured"}

        system_prompt = """
        You are a Forensic Linguist and Expert Copy Editor.
        Analyze the attached text to extract its 'Voice DNA' and constructing a ghostwriting profile.
        
        Look for:
        1. **Rhythm:** (e.g., Punchy/Staccato, Flowing/Academic, Conversational/Broken).
        2. **Vocabulary:** (e.g., Simple/Saxon, Complex/Latinate, Jargon-heavy, Metaphorical).
        3. **Forbidden Habits:** (e.g., 'Never starts sentences with And', 'Avoids corporate jargon like "leverage"', 'Never uses exclamation marks').
        4. **Structural Quirks:** (e.g., 'Uses one-sentence paragraphs for emphasis', 'starts emails with lowercase').
        
        Output a valid JSON object with the following fields:
        {
            "analysis_summary": "A brief 2-sentence summary of the detected tone (e.g. 'Sophisticated and authoritative with a penchant for medical metaphors.').",
            "system_instruction": "A precise, imperative instruction block that would force an LLM to write EXACTLY like this author. Do not include 'Here is the instruction', just the instruction itself."
        }
        """

        try:
            # Using generate_content for analysis
            response = await self.model.generate_content_async(
                contents=[system_prompt, f"--- TEXT SAMPLE ---\n{text[:10000]}"] # Truncate to avoid massive tokens if needed, though gemini can handle it.
            )
            
            # Simple parsing of JSON-like response (Gemini can be instructed to return JSON mode in newer versions, but we'll soft-parse/cleanup)
            # For robustness, we might want to use response_mime_type="application/json" if supported by the lib version, 
            # but for now we'll trust the prompt or strip ticks.
            
            clean_text = response.text.replace("```json", "").replace("```", "").strip()
            import json
            return json.loads(clean_text)
            
        except Exception as e:
            # Fallback mock for dev without keys or quota
            print(f"Analysis failed: {e}")
            return {
                "analysis_summary": "Could not analyze voice (AI Error). Defaulting to standard professional tone.",
                "system_instruction": "Write in a professional, clear, and concise manner."
            }

    async def save_voice(self, user_id: str, data: Dict[str, Any]):
        """
        Saves the voice analysis to Firestore.
        """
        if not self.db:
            print("Firestore not initialized, skipping save")
            return
            
        doc_ref = self.db.collection('users').document(user_id)
        doc_ref.set({
            'brand_voice': data
        }, merge=True)

    async def get_voice(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves the voice analysis from Firestore.
        """
        if not self.db:
            return None
            
        doc_ref = self.db.collection('users').document(user_id)
        doc = doc_ref.get()
        if doc.exists:
            data = doc.to_dict()
            return data.get('brand_voice')
        return None
