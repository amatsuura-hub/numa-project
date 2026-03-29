variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "lambda_function_name" {
  description = "Lambda function name for alarms"
  type        = string
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name for alarms"
  type        = string
}

variable "api_gateway_name" {
  description = "API Gateway REST API name for alarms"
  type        = string
}

variable "api_gateway_stage" {
  description = "API Gateway stage name for alarms"
  type        = string
}
