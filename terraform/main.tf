data "aws_ami" "ubuntu" {
  most_recent = true

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["099720109477"] # Canonical
}

provider "aws" {
  region = var.region
  access_key = var.access_key
  secret_key = var.secret_key
}

resource "aws_security_group" "allow_ssh_http" {
  name        = "allow_ssh"
  description = "Allow SSH inbound traffic"

  ingress {
    description = "SSH into VPC"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "SSH into VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    description = "Outbound Allowed"
    from_port   = 0
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "ec2_server" {
  ami           = data.aws_ami.ubuntu.id
  instance_type = var.instancetype
  key_name = "impostor-terraform"
  vpc_security_group_ids  = [aws_security_group.allow_ssh_http.id]

  provisioner "remote-exec" {
     on_failure = continue
     inline = [
       "sudo apt-get update",
       "sudo apt-get install -y nginx",
       "sudo systemctl start nginx"
     ]
   }
   connection {
     type = "ssh"
     user = "ec2-user"
     private_key = file("./impostor-terraform.pem")
     host = self.public_ip
   }
}