output "zone_id" {
  value = aws_route53_zone.main.zone_id
}

output "zone_name_servers" {
  value = aws_route53_zone.main.name_servers
}

output "cloudfront_certificate_arn" {
  value = aws_acm_certificate_validation.cloudfront.certificate_arn
}

output "api_domain_name" {
  value = "api.${var.domain_name}"
}

output "frontend_domain_name" {
  value = var.domain_name
}
