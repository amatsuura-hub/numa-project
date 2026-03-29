data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda" {
  name               = "${var.prefix}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_xray" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

data "aws_iam_policy_document" "dlq_access" {
  statement {
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.api_dlq.arn]
  }
}

resource "aws_iam_role_policy" "dlq_access" {
  name   = "${var.prefix}-dlq-access"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.dlq_access.json
}

data "aws_iam_policy_document" "dynamodb_access" {
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:BatchWriteItem",
      "dynamodb:BatchGetItem",
    ]
    resources = [
      var.dynamodb_table_arn,
      "${var.dynamodb_table_arn}/index/*",
    ]
  }
}

resource "aws_iam_role_policy" "dynamodb_access" {
  name   = "${var.prefix}-dynamodb-access"
  role   = aws_iam_role.lambda.id
  policy = data.aws_iam_policy_document.dynamodb_access.json
}

# Placeholder zip for initial deploy — replaced by CI/CD
data "archive_file" "placeholder" {
  type        = "zip"
  output_path = "${path.module}/placeholder.zip"

  source {
    content  = "placeholder"
    filename = "bootstrap"
  }
}

# DLQ for failed Lambda invocations
resource "aws_sqs_queue" "api_dlq" {
  name                      = "${var.prefix}-api-dlq"
  message_retention_seconds = 1209600 # 14 days
}

resource "aws_lambda_function" "api" {
  function_name                  = "${var.prefix}-api"
  role                           = aws_iam_role.lambda.arn
  handler                        = "bootstrap"
  runtime                        = "provided.al2023"
  memory_size                    = var.api_memory_size
  timeout                        = var.api_timeout
  reserved_concurrent_executions = var.api_reserved_concurrency >= 0 ? var.api_reserved_concurrency : null

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  dead_letter_config {
    target_arn = aws_sqs_queue.api_dlq.arn
  }

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      TABLE_NAME           = var.dynamodb_table_name
      COGNITO_USER_POOL_ID = var.cognito_user_pool_id
      COGNITO_CLIENT_ID    = var.cognito_client_id
      ENVIRONMENT          = var.environment
      ALLOWED_ORIGIN       = var.allowed_origin
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

# Post Confirmation Lambda Trigger
resource "aws_lambda_function" "post_confirmation" {
  function_name = "${var.prefix}-post-confirmation"
  role          = aws_iam_role.lambda.arn
  handler       = "bootstrap"
  runtime       = "provided.al2023"
  memory_size   = 128
  timeout       = 10

  filename         = data.archive_file.placeholder.output_path
  source_code_hash = data.archive_file.placeholder.output_base64sha256

  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      TABLE_NAME = var.dynamodb_table_name
    }
  }

  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
}

resource "aws_lambda_permission" "cognito_trigger" {
  statement_id  = "AllowCognitoInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.post_confirmation.function_name
  principal     = "cognito-idp.amazonaws.com"
  source_arn    = var.cognito_user_pool_arn
}

