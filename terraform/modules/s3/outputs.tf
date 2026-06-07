output "bucket_id" {
  description = "ID del bucket de S3 creado"
  value       = aws_s3_bucket.bucket.id
}

output "bucket_arn" {
  description = "ARN del bucket de S3 creado"
  value       = aws_s3_bucket.bucket.arn
}

output "bucket_domain_name" {
  description = "Nombre de dominio regional del bucket"
  value       = aws_s3_bucket.bucket.bucket_regional_domain_name
}
