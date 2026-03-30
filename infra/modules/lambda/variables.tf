variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  type        = string
}

variable "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito App Client ID"
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

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "api_memory_size" {
  description = "Memory size for API Lambda (MB). Go benefits from 256+ for better CPU allocation."
  type        = number
  default     = 256
}

variable "api_timeout" {
  description = "Timeout for API Lambda (seconds)"
  type        = number
  default     = 30
}

variable "api_reserved_concurrency" {
  description = "Reserved concurrent executions for API Lambda (-1 for unreserved)"
  type        = number
  default     = -1
}
