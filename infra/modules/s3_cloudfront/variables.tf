variable "prefix" {
  description = "Resource name prefix"
  type        = string
}

variable "aliases" {
  description = "Custom domain aliases for the CloudFront distribution (e.g. [\"numa-roadmap.com\"]). Empty to use default *.cloudfront.net."
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN (us-east-1) for the custom domain. Required when `aliases` is non-empty."
  type        = string
  default     = ""
}
