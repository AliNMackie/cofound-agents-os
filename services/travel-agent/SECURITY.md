# Security Policy

## Supported Versions

Use this section to tell people about which versions of your project are currently being supported with security updates.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of our software seriously. If you believe you have found a security vulnerability in the Voice-Activated Travel Agent, please report it to us as described below.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to `security@example.com`. You should receive a response within 24 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

## Security Best Practices for Deployment

When deploying this application to production, please adhere to the following security best practices:

### 1. Environment Variables
- **Never commit `.env` files** to version control.
- Use a secrets manager (like Google Secret Manager) for sensitive values in production.
- Ensure `FIREBASE_CREDENTIALS_JSON` and `STRIPE_SECRET_KEY` are kept confidential.

### 2. Authentication
- The application uses Firebase Authentication. Ensure your Firebase project settings are secure.
- OAuth credentials (`client_secrets.json`) should be rotated periodically.
- The `GOOGLE_CLIENT_SECRET` is critical for the OAuth flow; do not expose it.

### 3. Network Security
- Ensure the application is deployed behind a secure load balancer (like Cloud Load Balancing) with SSL/TLS termination.
- Restrict `CORS_ORIGIN` to your actual frontend domain in production, do not use `*`.

### 4. Container Security
- The Dockerfile runs as root by default. For higher security, configure a non-root user in the Dockerfile.
- Regularly scan your container images for vulnerabilities.

### 5. Data Protection
- This application stores user tokens in Firestore. Ensure Firestore security rules are configured to allow access only to authorized services/users.
