variable "project_name" {
  type        = string
  description = "Nombre del proyecto"
}

variable "environment" {
  type        = string
  description = "Nombre del entorno"
}

variable "subnet_ids" {
  type        = list(string)
  description = "Lista de subnet IDs de la VPC para asociar al clúster y nodos"
}
