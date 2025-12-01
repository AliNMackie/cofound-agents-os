output "stripe_webhook_url" {
  value = google_cloud_run_service.stripe_webhook.status[0].url
}

output "vpc_connector_id" {
  value = google_vpc_access_connector.connector.id
}
