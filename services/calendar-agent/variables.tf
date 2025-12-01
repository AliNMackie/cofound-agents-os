variable "project_id" {
  description = "The Google Cloud project ID."
  type        = string
}

variable "outlook_client_id" {
  description = "The client ID for the Outlook application."
  type        = string
}

variable "outlook_tenant_id" {
  description = "The tenant ID for the Outlook application."
  type        = string
}

variable "outlook_client_secret" {
  description = "The client secret for the Outlook application."
  type        = string
  sensitive   = true
}

variable "session_secret_key" {
  description = "The secret key for session management."
  type        = string
  sensitive   = true
}

variable "region" {
  description = "The default region for all resources."
  type        = string
  default     = "europe-west2"
}
variable "onboarding_api_image" {
  description = "The container image for the onboarding API."
  type        = string
  default     = "gcr.io/cloudrun/hello"
}
