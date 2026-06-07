output "vpc_id" {
  description = "ID de la VPC principal"
  value       = aws_vpc.main.id
}

output "s3_bucket_name" {
  description = "Nombre del bucket de S3"
  value       = module.s3.bucket_id
}

output "rds_endpoint" {
  description = "Endpoint de conexión para la base de datos PostgreSQL"
  value       = module.rds.db_instance_endpoint
}

output "eks_cluster_name" {
  description = "Nombre del clúster de EKS"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint del clúster de EKS"
  value       = module.eks.cluster_endpoint
}
