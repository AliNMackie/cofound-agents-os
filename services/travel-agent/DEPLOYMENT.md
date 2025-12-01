# Deployment Guide

This guide provides detailed instructions for deploying the Voice-Activated Travel Agent to Google Cloud Platform (GCP).

## Prerequisites

- Google Cloud Platform account
- GCP Project created
- Google Cloud SDK (`gcloud`) installed and authenticated
- Docker installed
- Terraform (optional, for infrastructure as code)

## Environment Setup

1.  **Enable Required APIs**:
    ```bash
    gcloud services enable \
      run.googleapis.com \
      firestore.googleapis.com \
      secretmanager.googleapis.com \
      cloudbuild.googleapis.com
    ```

2.  **Create Service Account**:
    Create a service account for the application with necessary permissions (Firestore User, Secret Manager Accessor).

## Deployment Options

### Option 1: Cloud Run (Recommended)

Cloud Run is a managed compute platform that automatically scales your stateless containers.

1.  **Build the Container Image**:
    ```bash
    export PROJECT_ID=$(gcloud config get-value project)
    docker build -t gcr.io/$PROJECT_ID/travel-agent:latest .
    ```

2.  **Push to Container Registry**:
    ```bash
    docker push gcr.io/$PROJECT_ID/travel-agent:latest
    ```

3.  **Deploy to Cloud Run**:
    ```bash
    gcloud run deploy travel-agent-service \
      --image gcr.io/$PROJECT_ID/travel-agent:latest \
      --region europe-west2 \
      --platform managed \
      --allow-unauthenticated \
      --set-env-vars="GCP_PROJECT_ID=$PROJECT_ID,GCP_REGION=europe-west2,CORS_ORIGIN=https://your-frontend-domain.com"
    ```

    *Note: You will need to set all required environment variables using `--set-env-vars` or `--set-secrets`.*

### Option 2: App Engine (Flexible Environment)

1.  **Create `app.yaml`**:
    Ensure you have an `app.yaml` file configured (see `app.yaml.example` if available, or create one based on Docker runtime).

2.  **Deploy**:
    ```bash
    gcloud app deploy
    ```

## Production Configuration

### Environment Variables

Ensure the following variables are set in your production environment:

- `GCP_PROJECT_ID`: Your GCP project ID
- `GCP_REGION`: Region (e.g., `europe-west2`)
- `FIREBASE_CREDENTIALS_JSON`: Base64 encoded service account JSON
- `STRIPE_SECRET_KEY`: Live Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Live Stripe webhook secret
- `STRIPE_PRICE_ID`: Live Stripe price ID
- `GOOGLE_CLIENT_ID`: OAuth Client ID
- `GOOGLE_CLIENT_SECRET`: OAuth Client Secret
- `GOOGLE_OAUTH_CALLBACK_URL`: Production callback URL (e.g., `https://api.yourdomain.com/auth/callback`)
- `CORS_ORIGIN`: Your production frontend URL

### Secrets Management

For sensitive variables like API keys and secrets, use Google Secret Manager:

1.  Create a secret in Secret Manager.
2.  Grant the Cloud Run service account access to the secret.
3.  Mount the secret as an environment variable during deployment.

## Monitoring and Logging

- **Logs**: View application logs in Cloud Logging.
- **Metrics**: Monitor CPU, memory, and request latency in Cloud Monitoring.
- **Health Check**: Configure the Cloud Run health check to probe `/health`.

## Rollback

To rollback to a previous version:

```bash
gcloud run services update-traffic travel-agent-service \
  --to-tags revision-tag=100
```
(Replace `revision-tag` with the specific revision you want to revert to).
