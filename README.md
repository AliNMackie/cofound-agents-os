# Communication Agent (Gmail Agent)

An intelligent Gmail automation agent that processes unread emails, generates draft replies using AI, and maintains idempotency through Firestore. Deployed on Google Cloud Functions Gen 2 with GDPR-compliant infrastructure.

## 🎯 Overview

This agent automatically:
- Monitors Gmail inbox for unread emails
- Uses Vertex AI (Gemini) to summarize emails and generate professional replies
- Creates draft responses in Gmail for review
- Prevents duplicate processing using Firestore-based idempotency
- Provides full observability through OpenTelemetry tracing

## 🏗️ Architecture

```
Cloud Scheduler (15min) → Cloud Function → Gmail API
                              ↓
                         Vertex AI (Gemini)
                              ↓
                         Firestore (Idempotency)
```

**Key Components:**
- **InboxAgent**: Core logic for email processing
- **IdempotencyGuard**: Firestore-based duplicate prevention
- **OpenTelemetry**: Distributed tracing for observability
- **Pydantic**: Type-safe data schemas

## 📋 Prerequisites

- Google Cloud Platform account
- GCP Project with billing enabled
- Required APIs enabled (see Terraform configuration)
- Python 3.11+
- Terraform 1.0+

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Git Hub Project 9 Communication Agent"
```

### 2. Set Up Python Environment

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configure GCP Project

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"

# Authenticate with GCP
gcloud auth application-default login
gcloud config set project $PROJECT_ID
```

### 4. Deploy Infrastructure

```bash
# Initialize Terraform
terraform init

# Review the plan
terraform plan -var="project_id=$PROJECT_ID"

# Deploy
terraform apply -var="project_id=$PROJECT_ID"
```

## 🧪 Local Development

### Run Unit Tests

```bash
python -m unittest discover -s tests
```

### Test Locally with Functions Framework

```bash
# Set environment variables
export PROJECT_ID="your-gcp-project-id"

# Run the function locally
functions-framework --target=handler --debug
```

### Using Docker

```bash
# Build the image
docker build -t gmail-agent .

# Run locally
docker run -p 8080:8080 \
  -e PROJECT_ID="your-gcp-project-id" \
  gmail-agent
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PROJECT_ID` | GCP Project ID | Yes |
| `LOG_LEVEL` | Logging level (INFO, DEBUG, ERROR) | No (default: INFO) |

### Terraform Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `project_id` | GCP Project ID | Yes |

## 📊 Monitoring

The application uses OpenTelemetry for distributed tracing. Traces include:
- Email processing spans
- Vertex AI generation spans
- Gmail API interaction spans
- Idempotency check events

**Privacy Note:** Email bodies are never logged, only metadata (email ID, sender, thread ID).

## 🔒 Security & Compliance

- **Region**: `europe-west2` (London) for GDPR compliance
- **Data Sovereignty**: All data stored in EU region
- **Deletion Protection**: Firestore has deletion protection enabled
- **No Public Access**: Storage buckets enforce public access prevention
- **Least Privilege**: Dedicated service accounts with minimal permissions
- **Internal Only**: Cloud Function ingress restricted to internal traffic

## 🛠️ CI/CD

GitHub Actions workflow automatically:
1. Runs unit tests
2. Authenticates with GCP using Workload Identity Federation
3. Deploys infrastructure via Terraform

### Required GitHub Secrets

- `GCP_PROJECT_ID`: Your GCP project ID
- `GCP_PROJECT_NUMBER`: Your GCP project number
- `GCP_WORKLOAD_IDENTITY_POOL`: Workload Identity Pool name
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Workload Identity Provider name

## 📁 Project Structure

```
.
├── main.py                          # Cloud Function entry point
├── requirements.txt                 # Python dependencies
├── main.tf                          # Terraform infrastructure
├── src/
│   ├── agents/
│   │   └── inbox_reader/
│   │       └── logic.py            # InboxAgent implementation
│   └── shared/
│       ├── idempotency.py          # Idempotency guard
│       └── schema.py               # Pydantic models
├── tests/
│   └── test_simulation.py          # Unit tests
└── .github/
    └── workflows/
        └── deploy.yaml             # CI/CD pipeline
```

## 🧩 Key Features

### Idempotency
Uses Firestore transactions to ensure each email is processed exactly once, even with concurrent executions.

### Spam Filtering
Automatically skips emails identified as spam by the AI model.

### Privacy-First
Adheres to strict privacy rules - email bodies are never logged, only processed.

### Observability
Full OpenTelemetry integration for production monitoring and debugging.

## 🐛 Troubleshooting

### Function Fails to Deploy
- Ensure all required APIs are enabled
- Verify service account permissions
- Check Terraform state for conflicts

### Emails Not Processing
- Verify Gmail API scopes are configured
- Check service account has Gmail access
- Review Cloud Function logs

### Idempotency Issues
- Ensure Firestore database is created
- Verify service account has `datastore.user` role

## 📄 License

[Add your license here]

## 🤝 Contributing

[Add contribution guidelines here]

## 📞 Support

[Add support contact information here]

---

**Built with ❤️ for GDPR-compliant email automation**
