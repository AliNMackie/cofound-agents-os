from presidio_analyzer import AnalyzerEngine
from presidio_anonymizer import AnonymizerEngine

def redact_pii(text: str) -> str:
    """
    Redacts personally identifiable information (PII) from a given text.
    
    This function specifically targets and removes:
    - Phone numbers
    - Email addresses

    Args:
        text: The input text to be redacted.

    Returns:
        The redacted text.
    """
    # Set up the analyzer
    analyzer = AnalyzerEngine()

    # Set up the anonymizer
    anonymizer = AnonymizerEngine()

    # Analyze the text for PII entities
    analyzer_results = analyzer.analyze(
        text=text,
        entities=["PHONE_NUMBER", "EMAIL_ADDRESS"],
        language='en'
    )
    
    # Anonymize the detected entities
    anonymized_text = anonymizer.anonymize(
        text=text,
        analyzer_results=analyzer_results
    )

    return anonymized_text.text
