variable "instancetype" {
  default = "t2.nano"
}

variable "access_key" {
  type = string
}

variable "secret_key" {
  type = string
}

variable "region" {
  type    = string
  default = "eu-west-3"
}