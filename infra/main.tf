resource "aws_iam_policy" "finops_policy" {

  name        = "${var.project_name}-policy"

  description = "FinOps detection policy"

  policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Action = [
          "ce:GetCostAndUsage",
          "ec2:DescribeInstances",
          "ec2:DescribeVolumes",
          "cloudwatch:GetMetricStatistics"
        ]

        Resource = "*"
      }
    ]
  })
}

resource "aws_s3_bucket" "finops_bucket" {

  bucket = "${var.project_name}-reports-${random_id.bucket_id.hex}"
}

resource "random_id" "bucket_id" {
  byte_length = 4
}

resource "aws_iam_role" "github_actions_oidc_role" {
  name = "github-actions-oidc-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"

    Statement = [
      {
        Effect = "Allow"

        Principal = {
          Federated = "arn:aws:iam::243699833421:oidc-provider/token.actions.githubusercontent.com"
        }

        Action = "sts:AssumeRoleWithWebIdentity"

        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }

          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:JoshuaOnaiwu/finops-automation-platform:*"
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  role       = aws_iam_role.github_actions_oidc_role.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}