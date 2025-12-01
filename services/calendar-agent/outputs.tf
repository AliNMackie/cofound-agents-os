output "onboarding_api_url" {
  description = "The URL of the onboarding API."
  value       = google_cloud_run_v2_service.onboarding_api.uri
}
