variable "domain_name" {
  description = "Root domain name (e.g. example.com)"
  type        = string
}

variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name"
  type        = string
}

variable "cloudfront_distribution_hosted_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  type        = string
}

variable "api_gateway_rest_api_id" {
  description = "API Gateway REST API ID"
  type        = string
}

variable "api_gateway_stage_name" {
  description = "API Gateway stage name"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
