variable "project_name" {
  type        = string
  description = "Nombre del proyecto"
}

variable "environment" {
  type        = string
  description = "Nombre del entorno"
}

variable "vpc_id" {
  type        = string
  description = "ID de la VPC"
}

variable "vpc_cidr" {
  type        = string
  description = "Bloque CIDR de la VPC"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Lista de subnets privadas para desplegar RDS"
}

variable "db_name" {
  type        = string
  description = "Nombre inicial de la base de datos"
  default     = "taller_devops_db"
}

variable "db_username" {
  type        = string
  description = "Usuario administrador"
}

variable "db_password" {
  type        = string
  description = "Contraseña administrador"
  sensitive   = true
}
