# Instructions for Agents

This file contains guidelines for AI agents working on this repository.

## Project Structure

*   `backend/`: Contains the FastAPI application logic.
    *   `main.py`: The core application file containing endpoints.
    *   `requirements.txt`: Python dependencies.
*   `frontend/`: Contains the Google Apps Script code for the client-side integration.
    *   `Code.js`: The script that runs in Google Sheets.
*   `terraform/`: Infrastructure as Code configurations.
    *   `main.tf`: Defines GCP resources (Firestore, Cloud Tasks, Secrets, Service Account).
*   `tests/`: Test suite.
    *   `test_main.py`: Pytest tests for backend logic.
*   `.github/workflows/`: CI/CD configurations.

## Tech Stack

*   **Language:** Python 3.10+
*   **Framework:** FastAPI
*   **Database:** Google Cloud Firestore (Native Mode)
*   **Async Queue:** Google Cloud Tasks
*   **Payments:** Stripe
*   **Infrastructure:** Terraform
*   **Testing:** Pytest

## Rules

1.  **Testing is Mandatory:** Always run `pytest` before asking for a PR merge or marking a task as complete. Ensure all tests pass.
2.  **No Secrets in Code:** Never hardcode API keys, credentials, or secrets. Always use environment variables (`os.environ.get`).
3.  **Infrastructure Awareness:** When adding services or needing new permissions (e.g., accessing a new Google Cloud API), check `terraform/main.tf` and update it if necessary.
4.  **Currency Safety:** When handling currency amounts, perform calculations carefully (e.g., `int(round(amount * 100))`) to avoid floating-point errors.
5.  **Clean Code:** Remove unused imports and ensure PEP 8 compliance where possible.

## Commands

*   **Run Tests:**
    ```bash
    export PYTHONPATH=$PYTHONPATH:.
    python3 -m pytest tests/
    ```

*   **Run Local Dev Server:**
    ```bash
    uvicorn backend.main:app --reload
    ```
    *(Note: Local runs require GCP credentials to be set up locally or mocked)*
