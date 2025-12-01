# Invoice Agent

This repository contains the code for a serverless invoice processing agent using Google Cloud Platform (GCP) and Stripe.

## Architecture

The system follows an event-driven architecture:

1.  **Google Sheets (Frontend):** A Google Apps Script (`frontend/Code.js`) reads invoice data (Name, Email, Amount, Description) from the active spreadsheet row.
2.  **Cloud Run (Backend - Enqueue):** The script sends an authenticated POST request to the `/enqueue` endpoint of the FastAPI backend running on Cloud Run.
3.  **Firestore:** The backend creates a document in the `invoices` collection with status 'QUEUED'.
4.  **Cloud Tasks:** The backend creates a task in the `invoice-processing-queue`.
5.  **Cloud Run (Backend - Process):** The task triggers the `/process_worker` endpoint, which:
    -   Creates a Stripe Customer and Invoice Item.
    -   Finalizes the Stripe Invoice.
    -   Updates the Firestore document with the Stripe Payment Link and status 'SENT'.
6.  **Stripe Webhook:** When the invoice is paid, Stripe sends a webhook to `/stripe_webhook`, which updates the Firestore document status to 'PAID'.

## Deployment

Deployment is automated using GitHub Actions.

1.  **Prerequisites:**
    -   A GCP Project.
    -   Stripe API Keys (Secret Key and Webhook Secret).
    -   A GitHub Repository with the following Secrets configured:
        -   `GCP_PROJECT_ID`: Your Google Cloud Project ID.
        -   `GCP_SA_KEY`: JSON key for a Service Account with permissions to deploy to Cloud Run (Service Account User, Cloud Run Admin, Artifact Registry Admin).
        -   `STRIPE_SECRET_KEY`: Your Stripe Secret Key.
        -   `STRIPE_WEBHOOK_SECRET`: Your Stripe Webhook Secret.

2.  **Infrastructure:**
    Initialize the infrastructure using Terraform locally or via a separate pipeline:
    ```bash
    cd terraform
    terraform init
    terraform apply -var="project_id=YOUR_PROJECT_ID"
    ```

3.  **Application:**
    Push to the `main` branch to trigger the GitHub Actions workflow defined in `.github/workflows/deploy.yaml`. This will deploy the FastAPI backend to Cloud Run.

4.  **Post-Deployment Configuration:**
    After the first successful deployment, get the Cloud Run Service URL:
    ```bash
    gcloud run services describe invoice-agent-backend --platform managed --region us-central1 --format "value(status.url)"
    ```
    Update the `SERVICE_URL` environment variable for your Cloud Run service:
    ```bash
    gcloud run services update invoice-agent-backend --update-env-vars SERVICE_URL=[YOUR_CLOUD_RUN_URL] --region us-central1
    ```

## Google Sheet Setup

1.  Create a new Google Sheet.
2.  Set up the header row (Row 1):
    -   Column A: **Name**
    -   Column B: **Email**
    -   Column C: **Amount**
    -   Column D: **Description**
    -   Column E: **Status** (System updated)
3.  Open **Extensions > Apps Script**.
4.  Copy the content of `frontend/Code.js` into the script editor.
5.  Update the `url` variable in the script with your Cloud Run Service URL.
6.  **Project Settings:** Link the Apps Script to your GCP Project (Project Settings > Google Cloud Platform (GCP) Project).
7.  Save and Run the `sendInvoice` function. You may need to authorize the script.
8.  (Optional) Create a menu item or button to trigger the function easily.
