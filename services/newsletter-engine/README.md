# Newsletter Engine v1.0

**An AI-powered newsletter generation system that learns your writing style and curates personalized content.**

[![GCP](https://img.shields.io/badge/Google%20Cloud-Ready-4285F4?logo=google-cloud)](https://cloud.google.com)
[![Firebase](https://img.shields.io/badge/Firebase-Enabled-FFCA28?logo=firebase)](https://firebase.google.com)
[![Python](https://img.shields.io/badge/Python-3.9+-3776AB?logo=python)](https://www.python.org)

---

## 🏗️ Architecture Overview

Newsletter Engine is a serverless, event-driven system built on Google Cloud Platform:

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Frontend  │─────▶│ API Gateway  │─────▶│   Ingest    │
│  (Firebase) │      │              │      │  Webhook    │
└─────────────┘      └──────────────┘      └──────┬──────┘
                                                   │
                                                   ▼
                                            ┌─────────────┐
                                            │   Pub/Sub   │
                                            └──────┬──────┘
                                                   │
                     ┌─────────────────────────────┼─────────────────┐
                     ▼                             ▼                 ▼
              ┌─────────────┐            ┌─────────────┐    ┌──────────────┐
              │     RAG     │            │    News     │    │  Firestore   │
              │ Vectorizer  │            │  Watchdog   │    │   (Drafts)   │
              └─────────────┘            └─────────────┘    └──────────────┘
                     │                           │
                     ▼                           ▼
              ┌─────────────┐            ┌─────────────┐
              │  Vertex AI  │            │  Cloud SQL  │
              │   Index     │            │ (Postgres)  │
              └─────────────┘            └─────────────┘
```

### Components

- **Frontend**: Firebase-hosted dashboard for content ingestion and draft editing
- **Ingest Webhook**: Cloud Function that scrapes URLs and publishes to Pub/Sub
- **RAG Vectorizer**: Generates embeddings using Vertex AI for semantic search
- **News Watchdog**: CRON-triggered function to scan for trending topics
- **Cloud SQL**: Stores client preferences and hot topics
- **Firestore**: Stores generated newsletter drafts

---

## 📋 Prerequisites

- **GCP Project** with billing enabled
- **Python 3.9+** for local development
- **Node.js 16+** (for Firebase CLI)
- **Terraform 1.0+** (for infrastructure provisioning)
- **Firebase Project** (can be the same as GCP project)

### Required GCP APIs

```bash
gcloud services enable \
  cloudfunctions.googleapis.com \
  pubsub.googleapis.com \
  sqladmin.googleapis.com \
  aiplatform.googleapis.com \
  firestore.googleapis.com \
  apigateway.googleapis.com
```

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd Newsletter_v1.0
```

### 2. Configure Environment Variables

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` and fill in your values:

```bash
# Firebase Configuration
FIREBASE_API_KEY=your-api-key-here
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=your-sender-id
FIREBASE_APP_ID=your-app-id
FIREBASE_MEASUREMENT_ID=your-measurement-id

# API Endpoints
API_GATEWAY_URL=https://your-gateway-url.nw.gateway.dev/v1/ingest
N8N_WEBHOOK_URL=http://localhost:5678/webhook/submit-feedback
```

### 3. Provision Infrastructure with Terraform

```bash
cd terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project_id = "your-gcp-project-id"
region = "europe-west2"
billing_account = "your-billing-account-id"
EOF

# Review the plan
terraform plan

# Apply infrastructure
terraform apply
```

### 4. Initialize Database

```bash
# Download Cloud SQL Proxy (if not already installed)
# Windows:
curl -o cloud_sql_proxy.exe https://dl.google.com/cloudsql/cloud_sql_proxy_x64.exe

# macOS/Linux:
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud_sql_proxy

# Start proxy (replace with your connection name)
./cloud_sql_proxy -instances=PROJECT:REGION:INSTANCE=tcp:5432

# In another terminal, load schema
psql -h localhost -U postgres -d newsletter < database/schema.sql
psql -h localhost -U postgres -d newsletter < database/seed_prompts.sql
```

### 5. Deploy Cloud Functions

**Ingest Webhook:**
```bash
cd backend/ingest_webhook
gcloud functions deploy ingest-webhook \
  --gen2 \
  --runtime=python39 \
  --region=europe-west2 \
  --source=. \
  --entry-point=ingest_content \
  --trigger-http \
  --allow-unauthenticated \
  --set-env-vars PROJECT_ID=your-project-id,TOPIC_ID=newsletter-ingestion
```

**RAG Vectorizer:**
```bash
cd backend/rag_vectorizer
gcloud functions deploy rag-vectorizer \
  --gen2 \
  --runtime=python39 \
  --region=europe-west2 \
  --source=. \
  --entry-point=process_pubsub \
  --trigger-topic=newsletter-ingestion \
  --set-env-vars PROJECT_ID=your-project-id
```

**News Watchdog:**
```bash
cd backend/news_watchdog
gcloud functions deploy news-watchdog \
  --gen2 \
  --runtime=python39 \
  --region=europe-west2 \
  --source=. \
  --entry-point=check_hot_topics \
  --trigger-topic=watchdog-trigger \
  --set-env-vars DB_USER=postgres,DB_PASS=your-password,DB_NAME=newsletter,CLOUD_SQL_CONNECTION_NAME=project:region:instance
```

### 6. Deploy Frontend

```bash
cd frontend

# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not already done)
firebase init hosting

# Deploy
firebase deploy --only hosting
```

---

## 🔧 Local Development

### Backend Functions

Each Cloud Function can be tested locally using Functions Framework:

```bash
cd backend/ingest_webhook
pip install -r requirements.txt
functions-framework --target=ingest_content --debug
```

### Frontend

Serve the frontend locally:

```bash
cd frontend/public
python -m http.server 8000
# Open http://localhost:8000
```

---

## 🌍 Environment Variables Reference

### Backend Functions

| Variable | Description | Required |
|----------|-------------|----------|
| `PROJECT_ID` | GCP Project ID | Yes |
| `TOPIC_ID` | Pub/Sub topic name | Yes (ingest_webhook) |
| `DB_USER` | PostgreSQL username | Yes (news_watchdog) |
| `DB_PASS` | PostgreSQL password | Yes (news_watchdog) |
| `DB_NAME` | Database name | Yes (news_watchdog) |
| `CLOUD_SQL_CONNECTION_NAME` | Cloud SQL connection string | Yes (news_watchdog) |

### Frontend

Set these in `window.ENV` before loading `app.js`, or use Firebase Hosting's automatic config:

| Variable | Description |
|----------|-------------|
| `FIREBASE_API_KEY` | Firebase API key |
| `FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `FIREBASE_PROJECT_ID` | Firebase project ID |
| `API_GATEWAY_URL` | API Gateway endpoint URL |
| `N8N_WEBHOOK_URL` | n8n webhook URL (optional) |

---

## 🧪 Testing

### Manual Testing

1. **Login**: Open the frontend and sign in with Google
2. **Ingest Content**: Paste a URL or text in the "Quick Add" section
3. **Check Logs**: Verify Cloud Function execution in GCP Console
4. **View Draft**: Check Firestore for generated drafts

### Health Checks

```bash
# Test ingest webhook
curl -X POST https://your-function-url.cloudfunctions.net/ingest-webhook \
  -H "Content-Type: application/json" \
  -d '{"client_id":"test","content":"Hello World"}'
```

---

## 📊 Monitoring

### View Logs

```bash
# Cloud Functions logs
gcloud functions logs read ingest-webhook --region=europe-west2 --limit=50

# Pub/Sub metrics
gcloud pubsub topics list
gcloud pubsub subscriptions list
```

### Cost Monitoring

Budget alerts are configured in Terraform (£40 threshold). View current spend:

```bash
gcloud billing accounts list
gcloud billing projects describe YOUR_PROJECT_ID
```

---

## 🔒 Security

- **Firebase Security Rules**: Configure in Firebase Console
- **API Gateway**: Requires authentication (Bearer token)
- **Cloud SQL**: Private IP only, no public access
- **Secrets**: Use Secret Manager for production credentials
- **IAM**: Follow principle of least privilege

---

## 🐛 Troubleshooting

### Common Issues

**Cloud Function fails to deploy:**
- Check that all required APIs are enabled
- Verify `requirements.txt` has correct versions
- Check Cloud Build logs for detailed errors

**Database connection fails:**
- Ensure Cloud SQL Proxy is running
- Verify connection name format: `project:region:instance`
- Check firewall rules and VPC settings

**Frontend can't connect to backend:**
- Verify API Gateway URL is correct
- Check CORS headers in Cloud Function
- Ensure Firebase authentication is working

---

## 📝 License

[Add your license here]

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📧 Support

For issues and questions:
- Open a GitHub issue
- Check GCP documentation: https://cloud.google.com/docs

---

**Built with ❤️ using Google Cloud Platform**
