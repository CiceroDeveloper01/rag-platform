variable "aws_region" { type = string }
variable "project_name" { type = string }
variable "environment" { type = string }
variable "vpc_cidr" { type = string }
variable "availability_zones" { type = list(string) }
variable "public_subnet_cidrs" { type = list(string) }
variable "private_subnet_cidrs" { type = list(string) }
variable "allowed_cidrs" { type = list(string) }
variable "app_instance_type" { type = string }
variable "observability_instance_type" { type = string }
variable "key_name" { type = string, default = null }
variable "db_name" { type = string }
variable "db_username" { type = string }
variable "db_password" { type = string, sensitive = true }
variable "db_instance_class" { type = string }
variable "redis_node_type" { type = string }
