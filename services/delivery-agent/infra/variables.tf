variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The Google Cloud region"
  type        = string
  default     = "europe-west2"
}

variable "stripe_api_key" {
  description = "Stripe API Key"
  type        = string
  sensitive   = true
}

variable "stripe_cidrs" {
  description = "List of Stripe IP CIDRs for Cloud Armor whitelist"
  type        = list(string)
  default     = [
    "54.187.174.169/32",
    "54.187.205.235/32",
    "54.187.216.72/32",
    "54.241.31.99/32",
    "54.241.31.102/32",
    "54.241.34.107/32"
  ] # Example list, in prod these should be comprehensive
}

variable "sendgrid_api_key" {
  description = "SendGrid API Key"
  type        = string
  sensitive   = true
}

variable "twilio_account_sid" {
  description = "Twilio Account SID"
  type        = string
  sensitive   = true
}

variable "twilio_auth_token" {
  description = "Twilio Auth Token"
  type        = string
  sensitive   = true
}

variable "twilio_from_number" {
  description = "Twilio From Number"
  type        = string
}

variable "contract_agent_url" {
  description = "Internal URL for the Contract Agent service"
  type        = string
}

variable "sendgrid_from_email" {
  description = "Email address to send from"
  type        = string
  default     = "no-reply@example.com"
}

variable "nudge_a_threshold_hours" {
  description = "Hours before sending Nudge A"
  type        = string
  default     = "24"
}

variable "nudge_b_threshold_hours" {
  description = "Hours before sending Nudge B"
  type        = string
  default     = "72"
}

variable "stripe_webhook_secret" {
  description = "Stripe Webhook Secret"
  type        = string
  sensitive   = true
}
