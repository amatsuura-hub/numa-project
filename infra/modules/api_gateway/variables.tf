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
