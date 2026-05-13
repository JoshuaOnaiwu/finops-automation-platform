output "bucket_name" {

  value = aws_s3_bucket.finops_bucket.bucket
}

output "iam_policy_arn" {

  value = aws_iam_policy.finops_policy.arn
}