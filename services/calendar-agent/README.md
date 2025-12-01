# Git Hub Project 11 Calendar

## Description
This project implements a calendar integration system using Google Cloud Platform (GCP). It includes:
- **Onboarding API**: A Flask-based API for handling user consent and authentication (e.g., for Outlook/Microsoft Graph).
- **Cloud Functions**: Serverless functions for event processing (currently a placeholder).
- **Infrastructure**: Terraform configuration for deploying resources to GCP (Secret Manager, Service Accounts, etc.).

## Prerequisites
- Python 3.11+
- Google Cloud SDK (gcloud)
- Terraform

## Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "Git Hub Project 11 Calendar"
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   # For the onboarding API specifically:
   pip install -r onboarding_api_source/requirements.txt
   ```

## Configuration
- Set up environment variables as required (refer to `variables.tf` for expected secrets).
- Ensure you have valid GCP credentials.

## Deployment
This project uses Terraform for infrastructure and Docker for the API.
Refer to `main.tf` for infrastructure details.
