output "cluster_name" {
  description = "Nombre del clúster de EKS"
  value       = aws_eks_cluster.eks.name
}

output "cluster_endpoint" {
  description = "Endpoint de control del clúster de EKS"
  value       = aws_eks_cluster.eks.endpoint
}

output "cluster_security_group_id" {
  description = "ID del Security Group creado automáticamente para el clúster"
  value       = aws_eks_cluster.eks.vpc_config[0].cluster_security_group_id
}

output "cluster_arn" {
  description = "ARN del clúster de EKS"
  value       = aws_eks_cluster.eks.arn
}
