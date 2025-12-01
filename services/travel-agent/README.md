# Voice-Activated Travel Agent

This project is a multi-tenant SaaS application for a voice-activated travel agent that helps users plan their trips to calendar events.

## Solopreneur Setup

This guide will help you get the project running with your own accounts for the required external services.

### 1. Prerequisites

*   A Google Cloud Platform (GCP) project.
*   A Firebase project linked to your GCP project.
*   A Stripe account.

### 2. Backend Configuration

1.  **Environment Variables**:
    *   Copy the `.env.example` file to a new file named `.env`.
    *   Fill in the values for all the environment variables.

2.  **Firebase Credentials**:
    *   In the Firebase console, go to **Project settings > Service accounts** and generate a new private key.
    *   This will download a JSON file. Base64 encode this file's contents. On macOS or Linux, you can use the following command:
        ```bash
        base64 -w 0 your-service-account-file.json
        ```
    *   Paste the resulting string into the `FIREBASE_CREDENTIALS_JSON` variable in your `.env` file.

3.  **Stripe Configuration**:
    *   In the Stripe dashboard, create a new product and add a recurring price to it.
    *   Copy the Price ID (it will look like `price_...`) and paste it into the `STRIPE_PRICE_ID` variable in your `.env` file.
    *   Get your Stripe secret key and webhook signing secret from the **Developers** section of the Stripe dashboard and add them to your `.env` file.

4.  **Google OAuth Configuration**:
    *   In the Google Cloud Console, go to **APIs & Services > Credentials**.
    *   Create OAuth 2.0 credentials for a Web application.
    *   Download the client configuration as JSON.
    *   Copy `client_secrets.json.example` to `client_secrets.json` and replace the placeholder values with your actual credentials:
        ```bash
        cp client_secrets.json.example client_secrets.json
        ```
    *   Edit `client_secrets.json` with your OAuth client ID and secret.
    *   **Important**: `client_secrets.json` is already in `.gitignore` - never commit this file!

### 5. Frontend Configuration

1.  **Firebase SDK Config**:
    *   In the Firebase console, go to **Project settings > General**.
    *   Under "Your apps", create a new Web app.
    *   Copy `frontend/.env.example` to `frontend/.env.local`:
        ```bash
        cp frontend/.env.example frontend/.env.local
        ```
    *   Firebase will give you a configuration object. Copy the values from this object into the `NEXT_PUBLIC_FIREBASE_*` variables in your `frontend/.env.local` file.

### 6. Running the Application

Once you have configured all the environment variables, you can start the application with the following command:

```bash
./start_dev.sh
```

This will start the backend on `http://localhost:8080` and the frontend on `http://localhost:3000`.

## Deploying to Google Cloud Platform

### Option 1: Deploy with Cloud Run (Recommended)

1.  **Build and push the Docker image**:
    ```bash
    # Set your GCP project ID
    export PROJECT_ID=your-gcp-project-id
    
    # Build the Docker image
    docker build -t gcr.io/$PROJECT_ID/travel-agent:latest .
    
    # Push to Google Container Registry
    docker push gcr.io/$PROJECT_ID/travel-agent:latest
    ```

2.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy travel-agent-service \
      --image gcr.io/$PROJECT_ID/travel-agent:latest \
      --region europe-west2 \
      --platform managed \
      --allow-unauthenticated
    ```

3.  **Set environment variables** via Cloud Run console or using `--set-env-vars` flag.

### Option 2: Deploy with Terraform

1.  **Navigate to the infrastructure directory**:
    ```bash
    cd infra
    ```

2.  **Initialize Terraform**:
    ```bash
    terraform init
    ```

3.  **Create a `terraform.tfvars` file** with your values:
    ```hcl
    project_id = "your-gcp-project-id"
    region = "europe-west2"
    google_client_id_value = "your-google-client-id"
    google_client_secret_value = "your-google-client-secret"
    ```

4.  **Apply the Terraform configuration**:
    ```bash
    terraform plan
    terraform apply
    ```

## Health Check

The application includes a health check endpoint at `/health` for monitoring:

```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "healthy",
  "service": "travel-agent",
  "version": "1.0.0"
}
```

