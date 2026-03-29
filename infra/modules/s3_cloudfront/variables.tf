variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "waf_web_acl_arn" {
  description = "WAFv2 Web ACL ARN for CloudFront (must be in us-east-1)"
  type        = string
  default     = ""
}
