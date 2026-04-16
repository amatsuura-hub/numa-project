terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

# us-east-1 provider required for CloudFront ACM certificates (must be in us-east-1)
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  prefix           = "${var.environment}-${var.project_name}"
  custom_domain_on = var.domain_name != ""
  frontend_origin  = local.custom_domain_on ? "https://${var.domain_name}" : module.s3_cloudfront.cloudfront_url
}

module "dynamodb" {
  source = "./modules/dynamodb"
  prefix = local.prefix
}

module "cognito" {
  source = "./modules/cognito"
  prefix = local.prefix

  post_confirmation_lambda_arn = module.lambda.post_confirmation_arn
}

# Note: Cognito <-> Lambda has a dependency cycle on first deploy.
# On first deploy, set post_confirmation_lambda_arn = "" in cognito module,
# then run terraform apply again with the actual ARN.

module "s3_cloudfront" {
  source = "./modules/s3_cloudfront"
  prefix = local.prefix

  aliases             = local.custom_domain_on ? [var.domain_name] : []
  acm_certificate_arn = local.custom_domain_on ? module.dns[0].cloudfront_certificate_arn : ""
}

module "lambda" {
  source = "./modules/lambda"
  prefix = local.prefix

  dynamodb_table_name   = module.dynamodb.table_name
  dynamodb_table_arn    = module.dynamodb.table_arn
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_client_id     = module.cognito.client_id
  allowed_origin        = local.frontend_origin
  cognito_user_pool_arn = module.cognito.user_pool_arn
  environment           = var.environment
}

module "api_gateway" {
  source = "./modules/api_gateway"
  prefix = local.prefix

  lambda_function_arn   = module.lambda.function_arn
  lambda_function_name  = module.lambda.function_name
  lambda_invoke_arn     = module.lambda.invoke_arn
  cognito_user_pool_arn = module.cognito.user_pool_arn
  allowed_origin        = local.frontend_origin
  environment           = var.environment
}

module "monitoring" {
  source = "./modules/monitoring"
  prefix = local.prefix

  lambda_function_name = module.lambda.function_name
  dynamodb_table_name  = module.dynamodb.table_name
  api_gateway_name     = module.api_gateway.rest_api_name
  api_gateway_stage    = var.environment
  dlq_name             = module.lambda.dlq_name
}

# DNS — enabled only when var.domain_name is set.
# NOTE: After the first apply, retrieve Route53 NS records
# (`terraform output dns_name_servers`) and configure them at the domain
# registrar so DNS queries resolve to this hosted zone.
module "dns" {
  count  = local.custom_domain_on ? 1 : 0
  source = "./modules/dns"
  prefix = local.prefix

  domain_name = var.domain_name
  environment = var.environment

  cloudfront_distribution_domain_name    = module.s3_cloudfront.distribution_domain_name
  cloudfront_distribution_hosted_zone_id = module.s3_cloudfront.distribution_hosted_zone_id
  api_gateway_rest_api_id                = module.api_gateway.rest_api_id
  api_gateway_stage_name                 = var.environment

  providers = {
    aws           = aws
    aws.us_east_1 = aws.us_east_1
  }
}
