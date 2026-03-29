bucket         = "numa-terraform-state"
key            = "prod/terraform.tfstate"
region         = "ap-northeast-1"
dynamodb_table = "numa-terraform-lock"
encrypt        = true
