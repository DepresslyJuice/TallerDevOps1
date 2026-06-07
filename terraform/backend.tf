terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Configuración del Backend Remoto Seguro para el archivo de estado
  # Nota: El bucket de S3 y la tabla de DynamoDB deben existir previamente o crearse en un paso de bootstrapping
  backend "s3" {
    bucket         = "taller-devops-terraform-state-bucket" # Reemplazar con el nombre de tu bucket de S3
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "taller-devops-terraform-locks"       # Tabla DynamoDB para State Locking
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}
