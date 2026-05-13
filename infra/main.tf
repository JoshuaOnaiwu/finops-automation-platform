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