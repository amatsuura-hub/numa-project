variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "post_confirmation_lambda_arn" {
  description = "Post Confirmation Lambda ARN"
  type        = string
  default     = ""
}
