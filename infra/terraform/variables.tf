# ===========================================
# TERRAFORM VARIABLES
# MovieHub Azure Infrastructure
# ===========================================

# ===== REQUIRED VARIABLES =====

variable "subscription_id" {
  description = "Azure Subscription ID"
  type        = string
  sensitive   = true
}

variable "resource_group_name" {
  description = "Name of the Azure Resource Group"
  type        = string
  default     = "rg-moviehub"
}

variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "eastus"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

# ===== ACR CONFIGURATION =====

variable "acr_name" {
  description = "Name of Azure Container Registry (must be globally unique, alphanumeric only)"
  type        = string
  default     = "moviehubacr"
}

variable "acr_sku" {
  description = "SKU for Azure Container Registry"
  type        = string
  default     = "Basic"
  validation {
    condition     = contains(["Basic", "Standard", "Premium"], var.acr_sku)
    error_message = "ACR SKU must be Basic, Standard, or Premium."
  }
}

# ===== CONTAINER APPS ENVIRONMENT =====

variable "aca_environment_name" {
  description = "Name of the Container Apps Environment"
  type        = string
  default     = "moviehub-env"
}

variable "log_analytics_workspace_name" {
  description = "Name of the Log Analytics Workspace"
  type        = string
  default     = "moviehub-logs"
}

# ===== SERVICE CONFIGURATION =====

variable "services" {
  description = "Configuration for each microservice"
  type = map(object({
    tcp_port     = number
    http_port    = number
    cpu          = number
    memory       = string
    min_replicas = number
    max_replicas = number
    is_external  = bool
    health_path  = string
    transport    = string  # "http" or "tcp"
  }))
  default = {
    api-gateway = {
      tcp_port     = 3000
      http_port    = 3000
      cpu          = 0.5
      memory       = "1Gi"
      min_replicas = 2
      max_replicas = 3
      is_external  = true
      health_path  = "/api/health"
      transport    = "http"
    }
    user-service = {
      tcp_port     = 3001
      http_port    = 3006
      cpu          = 0.25
      memory       = "0.5Gi"
      min_replicas = 2
      max_replicas = 2
      is_external  = false
      health_path  = ""
      transport    = "tcp"
    }
    movie-service = {
      tcp_port     = 3002
      http_port    = 3007
      cpu          = 0.25
      memory       = "0.5Gi"
      min_replicas = 2
      max_replicas = 2
      is_external  = false
      health_path  = ""
      transport    = "tcp"
    }
    cinema-service = {
      tcp_port     = 3003
      http_port    = 3008
      cpu          = 0.25
      memory       = "0.5Gi"
      min_replicas = 2
      max_replicas = 2
      is_external  = false
      health_path  = ""
      transport    = "tcp"
    }
    booking-service = {
      tcp_port     = 3004
      http_port    = 3005
      cpu          = 0.25
      memory       = "0.5Gi"
      min_replicas = 2
      max_replicas = 2
      is_external  = false
      health_path  = ""
      transport    = "tcp"
    }
  }
}

# ===== EXTERNAL SERVICES (OUTSOURCED) =====

variable "redis_connection_string" {
  description = "Connection string for external Redis (Azure Cache for Redis)"
  type        = string
  sensitive   = true
}

# ===== DATABASE CONNECTION STRINGS (OUTSOURCED) =====

variable "database_urls" {
  description = "Database connection strings for each service"
  type = object({
    user_service    = string
    movie_service   = string
    cinema_service  = string
    booking_service = string
  })
  sensitive = true
}

# ===== APPLICATION SECRETS =====

variable "clerk_secret_key" {
  description = "Clerk authentication secret key"
  type        = string
  sensitive   = true
}

variable "clerk_publishable_key" {
  description = "Clerk publishable key for frontend"
  type        = string
  sensitive   = true
}

# ===== EMAIL CONFIGURATION =====

variable "email_config" {
  description = "Email configuration for booking notifications"
  type = object({
    enabled  = bool
    host     = string
    port     = number
    secure   = bool
    user     = string
    password = string
    from     = string
  })
  sensitive = true
  default = {
    enabled  = false
    host     = "smtp.gmail.com"
    port     = 587
    secure   = false
    user     = ""
    password = ""
    from     = "MovieHub <noreply@moviehub.com>"
  }
}

# ===== VNPAY CONFIGURATION =====

variable "vnpay_config" {
  description = "VNPay payment gateway configuration"
  type = object({
    tmn_code    = string
    hash_secret = string
    url         = string
    return_url  = string
    api_url     = string
  })
  sensitive = true
  default = {
    tmn_code    = ""
    hash_secret = ""
    url         = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html"
    return_url  = ""
    api_url     = "https://sandbox.vnpayment.vn/merchant_webapi/merchant.html"
  }
}

# ===== TAGS =====

variable "tags" {
  description = "Tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "MovieHub"
    ManagedBy   = "Terraform"
    Environment = "dev"
  }
}
