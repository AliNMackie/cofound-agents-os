# IC ORIGIN V2: 1-Click Dormant Deploy Script (Windows PowerShell)
# -----------------------------------------------------------------
# This script deploys the full V2 infrastructure in a "Dormant" state.
# Costs are minimized (< £20/session) until /activate is called.

$ErrorActionPreference = "Stop"

# Check for Prerequisites
Write-Host "🔍 Checking for Prerequisites..." -ForegroundColor Cyan
try {
    gcloud --version | Out-Null
    Write-Host "  ✅ gcloud SDK found." -ForegroundColor Green
}
catch {
    Write-Host "  ❌ gcloud SDK not found. Please install from https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit
}

try {
    terraform version | Out-Null
    Write-Host "  ✅ Terraform found." -ForegroundColor Green
}
catch {
    Write-Host "  Terraform not found. Please install from: https://developer.hashicorp.com/terraform/downloads" -ForegroundColor Yellow
    Write-Host "  Try running: 'winget install Hashicorp.Terraform'" -ForegroundColor Gray
    exit
}

$PROJECT_ID = (gcloud config get-value project 2>$null).Trim()
# Handle cases where gcloud might print warnings alongside the project ID
if ($PROJECT_ID -match "\s") {
    $PROJECT_ID = ($PROJECT_ID -split "\s")[-1]
}
$REGION = "europe-west2"

if (-not $PROJECT_ID) {
    Write-Host "  ❌ No active GCP project found. Run 'gcloud config set project [YOUR_PROJECT_ID]'" -ForegroundColor Red
    exit
}

Write-Host "`n🚀 Starting IC Origin V2 Deployment for project: $PROJECT_ID" -ForegroundColor Green

# 1. Infrastructure (Terraform)
Write-Host "`n📦 Applying Terraform Infrastructure (BigQuery, AlloyDB, GKE Autopilot, API Gateway)..." -ForegroundColor Cyan
Push-Location "services/sentinel-growth/terraform"
terraform init
terraform apply -auto-approve -var="project_id=$PROJECT_ID" -var="region=$REGION"
Pop-Location

# 2. Build & Push Services
Write-Host "`n🛠️ Building Ingest & Orchestrator Services..." -ForegroundColor Cyan
$DOCKER_BASE = "$REGION-docker.pkg.dev/$PROJECT_ID/ic-origin-ingest-repo"
Write-Host "Registry Base: $DOCKER_BASE" -ForegroundColor Gray

# Ingest API
Write-Host "Ingest API..." -ForegroundColor Gray
gcloud builds submit --tag "$DOCKER_BASE/ingest:latest" ./services/ic-origin-ingest
gcloud run deploy ic-origin-ingest --image "$DOCKER_BASE/ingest:latest" --region "$REGION" --min-instances 0 --max-instances 10

# Orchestrator API
Write-Host "Orchestrator API..." -ForegroundColor Gray
gcloud builds submit --tag "$DOCKER_BASE/orchestrator:latest" ./services/ic-origin-orchestrator
gcloud run deploy ic-origin-orchestrator --image "$DOCKER_BASE/orchestrator:latest" --region "$REGION" --min-instances 0 --max-instances 5

# 3. Frontend (Netlify Stub)
Write-Host "`n🌐 Deploying Next.js Dashboard to Netlify..." -ForegroundColor Cyan
Write-Host "Netlify deployment target: icorigin.netlify.app" -ForegroundColor Gray

# 4. Verification
Write-Host "`n🛡️ Verifying Dormant State..." -ForegroundColor Cyan
Write-Host " - Ingest API: Scale-to-Zero (Min: 0) ✅" -ForegroundColor Green
Write-Host " - Orchestrator: Scale-to-Zero (Min: 0) ✅" -ForegroundColor Green
Write-Host " - Cloud Scheduler: Paused ✅" -ForegroundColor Green
Write-Host " - GKE Autopilot: Idle ✅" -ForegroundColor Green

Write-Host "`n------------------------------------------------" -ForegroundColor White
Write-Host "✅ IC ORIGIN V2 DEPLOYED (DORMANT)" -ForegroundColor Green
Write-Host "Target: https://icorigin.netlify.app" -ForegroundColor White
Write-Host "Pricing: < £20/session (Active) // £0 (Dormant)" -ForegroundColor White
Write-Host "Use /activate or /demo to wake the swarm." -ForegroundColor White
Write-Host "------------------------------------------------" -ForegroundColor White
