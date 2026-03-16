output "endpoint" {
  value = module.postgres.endpoint
}

output "port" {
  value = module.postgres.port
}

output "security_group_id" {
  value = module.postgres.security_group_id
}
