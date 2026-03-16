terraform {
  backend "s3" {
    bucket         = "rag-platform-terraform-state"
    key            = "rag-platform/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "rag-platform-terraform-locks"
    encrypt        = true
  }
}
