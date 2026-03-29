variable "environment" {
  description = "Environment name (dev/prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "numa"
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "domain_name" {
  description = "Custom domain name (e.g. example.com). Leave empty to skip DNS setup."
  type        = string
  default     = ""
}

variable "cloudfront_waf_rate_limit" {
  description = "CloudFront WAF rate limit per IP (5-minute window)"
  type        = number
  default     = 5000
}
