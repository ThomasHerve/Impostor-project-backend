terraform {
    backend "s3" {
        bucket = "impostor-terraform"
        key = "terraform.tfstate"
        region = "eu-west-3"
    }
}