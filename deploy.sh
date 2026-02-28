#!/bin/bash
set -e

# IC Origin Deployment Orchestrator
# Executes Terraform for backend and provides instructions for frontend.

TF_DIR="services/sentinel-growth/terraform"

echo "--- IC Origin Deployment Orchestrator ---"

# Step 1: Backend Infrastructure
echo "[1/3] Validating Terraform in $TF_DIR..."
cd "$TF_DIR"

terraform fmt
terraform init -backend=false # Use local backend for validation
terraform validate

echo "[2/3] Planing Deployment..."
# Note: terraform apply will prompt for approval
terraform apply

# Step 3: Frontend Instructions
echo ""
echo "[3/3] Infrastructure check complete."
echo "------------------------------------------------"
echo "Next Steps for Frontend (Netlify):"
echo "1. Log in to Netlify (app.netlify.com)"
echo "2. Create a new site from Git (GitHub/GitLab)"
echo "3. Select this repository and the 'main' branch"
echo "4. Netlify will detect 'netlify.toml' automatically"
echo "5. Add Environment Variables in Netlify UI:"
echo "   - NEXT_PUBLIC_API_URL: (Use the 'service_url' output from Terraform)"
echo "   - FIREBASE_PRIVATE_KEY: (From your service account JSON)"
echo "   - FIREBASE_CLIENT_EMAIL: (From your service account JSON)"
echo "------------------------------------------------"
echo "Deployment Orchestration Finished."
