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
