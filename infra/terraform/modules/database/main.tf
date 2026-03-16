module "postgres" {
  source = "../postgres"

  project_name               = var.project_name
  environment                = var.environment
  vpc_id                     = var.vpc_id
  private_subnet_ids         = var.private_subnet_ids
  allowed_security_group_ids = var.allowed_security_group_ids
  db_name                    = var.db_name
  username                   = var.username
  password                   = var.password
  instance_class             = var.instance_class
  allocated_storage          = var.allocated_storage
}
