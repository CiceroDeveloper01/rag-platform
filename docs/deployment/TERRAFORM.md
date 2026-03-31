# Terraform Infrastructure Guide

This document explains how infrastructure-as-code is organized in **Intelligent Automation Platform**, how to run Terraform locally, and how the GitHub Actions deployment flow applies infrastructure changes across environments.

## Purpose

The Terraform layer provisions the minimum AWS infrastructure required to run the platform outside the local Docker stack. It is designed to be:

- reusable across environments
- simple to understand and extend
- compatible with the current monorepo structure
- aligned with the existing CI/CD workflows

Terraform in this repository is used for cloud infrastructure provisioning. It does not replace the local Docker Compose setup used for development and demos.

## Directory Structure

Terraform assets live under:

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

### `modules/`

Reusable building blocks shared across environments.

- `network`: VPC, subnets, routing, and security foundations
- `compute`: application compute layer and load balancer
- `database`: compatibility wrapper around the PostgreSQL module
- `postgres`: managed PostgreSQL infrastructure
- `redis`: managed Redis cache infrastructure
- `observability`: observability-related cloud resources

### `backend/`

Template-only backend configuration prepared for S3 remote state. It is kept separate so the repository has an explicit reference for backend strategy without forcing a single state layout onto every environment.

### `envs/`

Each environment has its own Terraform root module:

- `envs/dev`
- `envs/staging`
- `envs/prod`

Each environment contains:

- `main.tf`: module composition
- `variables.tf`: input declarations
- `terraform.tfvars`: environment-specific values

### `providers/`

Shared provider configuration for AWS.

## Environment Strategy

The repository separates infrastructure by lifecycle stage:

- `dev`: iterative development and validation
- `staging`: pre-production validation for release branches
- `prod`: production-grade environment applied from version tags

This separation keeps variables, state, and deployment cadence isolated while still reusing the same module set.

## What Terraform Provisions

The current baseline provisions:

- AWS VPC
- public and private subnets
- security groups
- application compute layer
- load balancer
- RDS PostgreSQL
- Redis
- observability-related infrastructure

Local PostgreSQL for Docker-based development remains exposed externally on port `5433`. That local setup is separate from the AWS RDS resources managed by Terraform.

## Remote State

Each environment uses a remote Terraform backend in AWS S3, with DynamoDB used for state locking.

Before running Terraform for the first time, make sure these shared backend resources already exist:

- S3 bucket for state, for example `rag-platform-terraform-state`
- DynamoDB table for locks, for example `rag-platform-terraform-locks`

Without those resources, `terraform init` will fail.

## Running Terraform Locally

### Prerequisites

Install and configure:

- Terraform
- AWS CLI
- valid AWS credentials with permission to read/write the target infrastructure and Terraform backend

You can authenticate with either exported environment variables or a configured AWS profile.

Examples:

```bash
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### Dev Environment

```bash
cd infra/terraform/envs/dev
terraform init
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

### Staging Environment

```bash
cd infra/terraform/envs/staging
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

### Production Environment

```bash
cd infra/terraform/envs/prod
terraform init
terraform plan -var-file=terraform.tfvars
terraform apply -var-file=terraform.tfvars
```

### Destroy

Use destroy carefully and only in the intended environment:

```bash
terraform destroy -var-file=terraform.tfvars
```

## Automatic Deployments

Infrastructure deployment is automated through GitHub Actions workflows in `.github/workflows`.

### `deploy-dev.yml`

Trigger:

- `push` to `develop`
- manual `workflow_dispatch`

Flow:

1. Checkout repository
2. Build API Docker image
3. Build web Docker image
4. Configure AWS credentials from GitHub Secrets
5. Run `terraform init`
6. Run `terraform plan -var-file=terraform.tfvars -out=tfplan`
7. Run `terraform apply -auto-approve tfplan`

Terraform root used:

```text
infra/terraform/envs/dev
```

### `deploy-staging.yml`

Trigger:

- `push` to `release/*`
- manual `workflow_dispatch`

Terraform root used:

```text
infra/terraform/envs/staging
```

The workflow follows the same init, plan, and apply sequence as `dev`.

### `deploy-prod.yml`

Trigger:

- `push` tags matching `v*`
- manual `workflow_dispatch`

Terraform root used:

```text
infra/terraform/envs/prod
```

This workflow applies the production environment after Docker build validation and AWS authentication.

## GitHub Secrets Configuration

The deployment workflows currently require these repository secrets:

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`

Recommended setup:

1. Create a dedicated IAM identity for GitHub Actions.
2. Grant only the permissions required for:
   - Terraform backend access in S3 and DynamoDB
   - the AWS resources managed by the Terraform modules
3. Add the credentials to the repository or organization secrets in GitHub.

Suggested GitHub path:

```text
Repository Settings -> Secrets and variables -> Actions
```

If the project later moves to OIDC-based federation, these static secrets can be replaced by role assumption without changing the Terraform module structure.

## CI/CD Flow

The repository currently separates validation from environment deployment.

### CI Validation

`ci.yml` runs on pushes to `main` and `develop` and performs:

- backend install
- frontend install
- lint
- tests
- coverage generation
- backend build
- frontend build
- Docker build validation

This workflow verifies the application before environment-specific deployment workflows are triggered.

### Infrastructure Deployment

Environment deploy workflows then execute:

- Docker image builds for the API and web applications
- AWS credential configuration
- Terraform init, plan, and apply for the matching environment

In practice, the flow is:

1. Code is pushed to an environment branch or tagged release.
2. GitHub Actions selects the matching workflow.
3. Application images are built.
4. Terraform reconciles the target AWS infrastructure state.

## Operational Notes

- Terraform and Docker Compose serve different purposes in this repository.
- Docker Compose is the primary local runtime stack.
- Terraform is the cloud provisioning layer for AWS environments.
- `terraform.tfvars` files should be reviewed before apply in each account.
- State backend resources must exist before the first initialization.

## Related Files

- [Deployment Guide](DEPLOYMENT.md)
- [Terraform README](/home/cicero/projects/rag-platform/infra/terraform/README.md)
- [CI Workflow](/home/cicero/projects/rag-platform/.github/workflows/ci.yml)
- [Deploy Dev Workflow](/home/cicero/projects/rag-platform/.github/workflows/deploy-dev.yml)
- [Deploy Staging Workflow](/home/cicero/projects/rag-platform/.github/workflows/deploy-staging.yml)
- [Deploy Prod Workflow](/home/cicero/projects/rag-platform/.github/workflows/deploy-prod.yml)
