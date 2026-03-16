# Terraform Infrastructure

This directory contains reusable Terraform modules and environment compositions for **RAG-PLATAFORM** on AWS.

## Structure

```text
infra/terraform/
├── backend/
│   └── s3.tf
├── modules/
│   ├── compute/
│   ├── database/
│   ├── network/
│   ├── observability/
│   ├── postgres/
│   └── redis/
├── envs/
│   ├── dev/
│   ├── staging/
│   └── prod/
└── providers/
    └── aws.tf
```

## What gets provisioned

- VPC with public and private subnets
- security groups
- application compute layer on EC2 + ALB
- RDS PostgreSQL
- ElastiCache Redis
- dedicated observability EC2 host

The `database` module is a compatibility wrapper that delegates to the existing PostgreSQL module, which keeps the current structure intact while exposing the generic module name some infrastructure guides expect.

## Remote state

Each environment uses an S3 backend and a DynamoDB lock table.

Before running Terraform, create:

- an S3 bucket for state, such as `rag-platform-terraform-state`
- a DynamoDB table for locks, such as `rag-platform-terraform-locks`

## Usage

Example for the `dev` environment:

```bash
cd infra/terraform/envs/dev
terraform init
terraform plan
terraform apply
```

## Notes

- PostgreSQL in local Docker remains externally available on port `5433`
- Terraform here describes AWS infrastructure, not the local Docker stack
- `terraform.tfvars` files are examples and should be adjusted per account and region
