# IC Origin Deployment Orchestrator (PowerShell)
# Executes Terraform for backend and provides instructions for frontend.

$ErrorActionPreference = "Stop"
$TF_DIR = "services/sentinel-growth/terraform"

Write-Host "--- IC Origin Deployment Orchestrator (Windows) ---" -ForegroundColor Cyan

# Step 1: Backend Infrastructure
Write-Host "[1/3] Validating Terraform in $TF_DIR..." -ForegroundColor Yellow
Push-Location $TF_DIR

& terraform fmt
& terraform init -backend=false # Use local backend for validation
& terraform validate

Write-Host "[2/3] Planning Deployment..." -ForegroundColor Yellow
# Note: terraform apply will prompt for approval
& terraform apply

# Step 3: Frontend Instructions
Pop-Location
Write-Host ""
Write-Host "[3/3] Infrastructure check complete." -ForegroundColor Green
Write-Host "------------------------------------------------" -ForegroundColor White
Write-Host "Next Steps for Frontend (Netlify):" -ForegroundColor White
Write-Host "1. Log in to Netlify (app.netlify.com)"
Write-Host "2. Create a new site from Git (GitHub/GitLab)"
Write-Host "3. Select this repository and the 'main' branch"
Write-Host "4. Netlify will detect 'netlify.toml' automatically"
Write-Host "5. Add Environment Variables in Netlify UI:"
Write-Host "   - NEXT_PUBLIC_API_URL: (Use the 'service_url' output from Terraform)"
Write-Host "   - FIREBASE_PRIVATE_KEY: (From your service account JSON)"
Write-Host "   - FIREBASE_CLIENT_EMAIL: (From your service account JSON)"
Write-Host "------------------------------------------------" -ForegroundColor White
Write-Host "Deployment Orchestration Finished." -ForegroundColor Cyan
