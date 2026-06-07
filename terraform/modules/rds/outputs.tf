output "db_instance_endpoint" {
  description = "Dirección de conexión de la base de datos (host:port)"
  value       = aws_db_instance.postgres.endpoint
}

output "db_instance_address" {
  description = "Dirección DNS de conexión de la base de datos"
  value       = aws_db_instance.postgres.address
}

output "db_instance_arn" {
  description = "ARN de la instancia RDS"
  value       = aws_db_instance.postgres.arn
}
