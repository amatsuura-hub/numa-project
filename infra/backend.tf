# Remote backend configuration
# Bootstrap resources (S3 bucket + DynamoDB lock table) are created below.
# Once they exist, enable the remote backend by uncommenting the block below
# and running:
#   terraform init -migrate-state
# This will move local state to S3. Required for team collaboration and CI.
#
# terraform {
#   backend "s3" {
#     bucket         = "numa-terraform-state"
#     key            = "dev/terraform.tfstate"
#     region         = "ap-northeast-1"
#     dynamodb_table = "numa-terraform-lock"
#     encrypt        = true
#   }
# }

# Bootstrap resources for remote backend (run once with local state)
resource "aws_s3_bucket" "terraform_state" {
  bucket = "numa-terraform-state"

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_lock" {
  name         = "numa-terraform-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  lifecycle {
    prevent_destroy = true
  }
}
