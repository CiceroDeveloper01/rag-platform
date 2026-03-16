terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.42"
    }
  }

  backend "s3" {
    bucket         = "rag-platform-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "rag-platform-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source               = "../../modules/network"
  project_name         = var.project_name
  environment          = var.environment
  vpc_cidr             = var.vpc_cidr
  availability_zones   = var.availability_zones
  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs
}

module "compute" {
  source            = "../../modules/compute"
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
  instance_type     = var.app_instance_type
  key_name          = var.key_name
  allowed_cidrs     = var.allowed_cidrs
}

module "postgres" {
  source                     = "../../modules/postgres"
  project_name               = var.project_name
  environment                = var.environment
  vpc_id                     = module.network.vpc_id
  private_subnet_ids         = module.network.private_subnet_ids
  allowed_security_group_ids = [module.compute.app_security_group_id]
  db_name                    = var.db_name
  username                   = var.db_username
  password                   = var.db_password
  instance_class             = var.db_instance_class
}

module "redis" {
  source                     = "../../modules/redis"
  project_name               = var.project_name
  environment                = var.environment
  vpc_id                     = module.network.vpc_id
  private_subnet_ids         = module.network.private_subnet_ids
  allowed_security_group_ids = [module.compute.app_security_group_id]
  node_type                  = var.redis_node_type
}

module "observability" {
  source            = "../../modules/observability"
  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.network.vpc_id
  public_subnet_ids = module.network.public_subnet_ids
  allowed_cidrs     = var.allowed_cidrs
  instance_type     = var.observability_instance_type
  key_name          = var.key_name
}

output "alb_dns_name" {
  value = module.compute.alb_dns_name
}

output "postgres_endpoint" {
  value = module.postgres.endpoint
}

output "redis_endpoint" {
  value = module.redis.primary_endpoint
}

output "observability_public_dns" {
  value = module.observability.public_dns
}
