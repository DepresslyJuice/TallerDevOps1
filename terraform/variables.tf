variable "aws_region" {
  description = "Región de AWS donde se desplegarán los recursos"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Nombre del entorno (ej: staging, production)"
  type        = string
  default     = "staging"
}

variable "project_name" {
  description = "Nombre del proyecto para etiquetar recursos"
  type        = string
  default     = "taller-devops"
}

variable "vpc_cidr" {
  description = "Bloque CIDR de la VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_username" {
  description = "Usuario administrador de la base de datos RDS"
  type        = string
  default     = "dbadmin"
}

variable "db_password" {
  description = "Contraseña del administrador de la base de datos RDS"
  type        = string
  sensitive   = true
  default     = "SuperSecurePassword123!" # Nota: En producción, usar Vault o Secrets Manager
}
