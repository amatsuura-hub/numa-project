variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "lambda_function_arn" {
  description = "Lambda function ARN"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda function name"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Lambda invoke ARN"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "allowed_origin" {
  description = "Allowed CORS origin"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "waf_rate_limit" {
  description = "API WAF rate limit per IP (5-minute window)"
  type        = number
  default     = 2000
}

variable "throttling_burst_limit" {
  description = "API Gateway throttling burst limit"
  type        = number
  default     = 50
}

variable "throttling_rate_limit" {
  description = "API Gateway throttling rate limit (requests/sec)"
  type        = number
  default     = 100
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}
