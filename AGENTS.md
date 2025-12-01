- Context: A Gmail Agent on Cloud Functions (Gen 2) that reads emails, checks Firestore for idempotency, and uses Vertex AI to summarize/draft. 
- Rules: 
  1. Idempotency: MUST check `IdempotencyGuard` before processing any email. 
  2. Schema: Inputs/Outputs must use Pydantic models. 
  3. Observability: Use OpenTelemetry for tracing. 
  4. Privacy: Log metadata only, never email bodies. 
  5. Compliance: Deployed in `europe-west2` (London) to adhere to GDPR data sovereignty.
