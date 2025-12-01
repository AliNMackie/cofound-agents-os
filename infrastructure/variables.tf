variable "project_id" {
  description = "The Google Cloud Project ID"
  type        = string
}

variable "region" {
  description = "The Google Cloud region"
  type        = string
  default     = "europe-west2"
}

variable "webhook_url" {
  description = "The Webhook URL for n8n"
  type        = string
  default     = "https://placeholder-url.com"
}
