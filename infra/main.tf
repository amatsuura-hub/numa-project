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

locals {
  prefix = "${var.environment}-${var.project_name}"
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
}

module "lambda" {
  source = "./modules/lambda"
  prefix = local.prefix

  dynamodb_table_name   = module.dynamodb.table_name
  dynamodb_table_arn    = module.dynamodb.table_arn
  cognito_user_pool_id  = module.cognito.user_pool_id
  cognito_client_id     = module.cognito.client_id
  allowed_origin        = module.s3_cloudfront.cloudfront_url
  cognito_user_pool_arn = module.cognito.user_pool_arn
  environment           = var.environment
}

module "api_gateway" {
  source = "./modules/api_gateway"
  prefix = local.prefix

  lambda_function_arn      = module.lambda.function_arn
  lambda_function_name     = module.lambda.function_name
  lambda_invoke_arn        = module.lambda.invoke_arn
  cognito_user_pool_arn    = module.cognito.user_pool_arn
  allowed_origin           = module.s3_cloudfront.cloudfront_url
  environment              = var.environment
}
