output "dynamodb_table_name" {
  value = module.dynamodb.table_name
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_client_id" {
  value = module.cognito.client_id
}

output "cloudfront_url" {
  value = module.s3_cloudfront.cloudfront_url
}

output "cloudfront_distribution_id" {
  value = module.s3_cloudfront.distribution_id
}

output "s3_bucket_name" {
  value = module.s3_cloudfront.bucket_name
}

output "api_gateway_url" {
  value = module.api_gateway.api_url
}

output "lambda_function_name" {
  value = module.lambda.function_name
}

output "cognito_user_pool_arn" {
  value = module.cognito.user_pool_arn
}

output "monitoring_sns_topic_arn" {
  value = module.monitoring.sns_topic_arn
}

# DNS outputs — populated only when var.domain_name is set.
# After the first apply, register `dns_name_servers` at the domain registrar.
output "dns_name_servers" {
  description = "Route 53 zone name servers (register these at the domain registrar)"
  value       = try(module.dns[0].zone_name_servers, [])
}

output "frontend_url" {
  description = "Public frontend URL (custom domain when set, otherwise CloudFront default)"
  value       = local.frontend_origin
}

output "api_custom_domain_url" {
  description = "API Gateway custom domain URL (only set when domain_name is configured)"
  value       = try("https://${module.dns[0].api_domain_name}", "")
}
