# ===========================================
# TERRAFORM MAIN CONFIGURATION
# MovieHub Azure Infrastructure
# ===========================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.100"
    }
  }

  # Backend configuration for remote state storage
  # Uncomment and configure for production use
  # backend "azurerm" {
  #   resource_group_name  = "rg-terraform-state"
  #   storage_account_name = "moviehubterraformstate"
  #   container_name       = "tfstate"
  #   key                  = "moviehub.terraform.tfstate"
  # }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
  subscription_id = var.subscription_id
}

# ===========================================
# RESOURCE GROUP
# ===========================================

resource "azurerm_resource_group" "main" {
  name     = "${var.resource_group_name}-${var.environment}"
  location = var.location
  tags     = merge(var.tags, { Environment = var.environment })
}

# ===========================================
# LOG ANALYTICS WORKSPACE
# ===========================================

resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.log_analytics_workspace_name}-${var.environment}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
  tags                = merge(var.tags, { Environment = var.environment })
}

# ===========================================
# AZURE CONTAINER REGISTRY
# ===========================================

resource "azurerm_container_registry" "main" {
  name                = "${var.acr_name}${var.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = var.acr_sku
  admin_enabled       = true
  tags                = merge(var.tags, { Environment = var.environment })
}

# ===========================================
# CONTAINER APPS ENVIRONMENT
# ===========================================

resource "azurerm_container_app_environment" "main" {
  name                       = "${var.aca_environment_name}-${var.environment}"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  tags                       = merge(var.tags, { Environment = var.environment })
}

# ===========================================
# CONTAINER APPS - BACKEND SERVICES
# ===========================================

# User Service
resource "azurerm_container_app" "user_service" {
  name                         = "user-service"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Multiple"
  tags                         = merge(var.tags, { Service = "user-service" })

  secret {
    name  = "database-url"
    value = var.database_urls.user_service
  }

  secret {
    name  = "clerk-secret-key"
    value = var.clerk_secret_key
  }

  secret {
    name  = "redis-url"
    value = var.redis_connection_string
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = false
    target_port      = var.services["user-service"].tcp_port
    transport        = "tcp"
    
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.services["user-service"].min_replicas
    max_replicas = var.services["user-service"].max_replicas

    container {
      name   = "user-service"
      image  = "${azurerm_container_registry.main.login_server}/user-service:latest"
      cpu    = var.services["user-service"].cpu
      memory = var.services["user-service"].memory

      readiness_probe {
        http_get {
          path   = "/health/ready"
          port   = var.services["user-service"].http_port
          scheme = "HTTP"
        }
        initial_delay = 5
        interval_seconds = 10
        timeout_seconds = 2
        failure_threshold = 2
        success_threshold = 1
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "TCP_HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "TCP_PORT"
        value = tostring(var.services["user-service"].tcp_port)
      }

      env {
        name  = "HTTP_PORT"
        value = tostring(var.services["user-service"].http_port)
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "CLERK_SECRET_KEY"
        secret_name = "clerk-secret-key"
      }

      env {
        name        = "REDIS_URL"
        secret_name = "redis-url"
      }
    }
  }
}

# Movie Service
resource "azurerm_container_app" "movie_service" {
  name                         = "movie-service"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Multiple"
  tags                         = merge(var.tags, { Service = "movie-service" })

  secret {
    name  = "database-url"
    value = var.database_urls.movie_service
  }

  secret {
    name  = "redis-url"
    value = var.redis_connection_string
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = false
    target_port      = var.services["movie-service"].tcp_port
    transport        = "tcp"
    
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.services["movie-service"].min_replicas
    max_replicas = var.services["movie-service"].max_replicas

    container {
      name   = "movie-service"
      image  = "${azurerm_container_registry.main.login_server}/movie-service:latest"
      cpu    = var.services["movie-service"].cpu
      memory = var.services["movie-service"].memory

      readiness_probe {
        http_get {
          path   = "/health/ready"
          port   = var.services["movie-service"].http_port
          scheme = "HTTP"
        }
        initial_delay = 5
        interval_seconds = 10
        timeout_seconds = 2
        failure_threshold = 2
        success_threshold = 1
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "TCP_HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "TCP_PORT"
        value = tostring(var.services["movie-service"].tcp_port)
      }

      env {
        name  = "HTTP_PORT"
        value = tostring(var.services["movie-service"].http_port)
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "REDIS_URL"
        secret_name = "redis-url"
      }
    }
  }
}

# Cinema Service
resource "azurerm_container_app" "cinema_service" {
  name                         = "cinema-service"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Multiple"
  tags                         = merge(var.tags, { Service = "cinema-service" })

  secret {
    name  = "database-url"
    value = var.database_urls.cinema_service
  }

  secret {
    name  = "redis-url"
    value = var.redis_connection_string
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = false
    target_port      = var.services["cinema-service"].tcp_port
    transport        = "tcp"
    
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.services["cinema-service"].min_replicas
    max_replicas = var.services["cinema-service"].max_replicas

    container {
      name   = "cinema-service"
      image  = "${azurerm_container_registry.main.login_server}/cinema-service:latest"
      cpu    = var.services["cinema-service"].cpu
      memory = var.services["cinema-service"].memory

      readiness_probe {
        http_get {
          path   = "/health/ready"
          port   = var.services["cinema-service"].http_port
          scheme = "HTTP"
        }
        initial_delay = 5
        interval_seconds = 10
        timeout_seconds = 2
        failure_threshold = 2
        success_threshold = 1
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "TCP_HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "TCP_PORT"
        value = tostring(var.services["cinema-service"].tcp_port)
      }

      env {
        name  = "HTTP_PORT"
        value = tostring(var.services["cinema-service"].http_port)
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      # Service discovery for movie-service
      env {
        name  = "MOVIE_HOST"
        value = "movie-service"
      }

      env {
        name  = "MOVIE_PORT"
        value = tostring(var.services["movie-service"].tcp_port)
      }

      env {
        name        = "REDIS_URL"
        secret_name = "redis-url"
      }
    }
  }
}

# Booking Service
resource "azurerm_container_app" "booking_service" {
  name                         = "booking-service"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Multiple"
  tags                         = merge(var.tags, { Service = "booking-service" })

  secret {
    name  = "database-url"
    value = var.database_urls.booking_service
  }

  secret {
    name  = "redis-url"
    value = var.redis_connection_string
  }

  secret {
    name  = "email-password"
    value = var.email_config.password
  }

  secret {
    name  = "vnpay-hash-secret"
    value = var.vnpay_config.hash_secret
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = false
    target_port      = var.services["booking-service"].tcp_port
    transport        = "tcp"
    
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.services["booking-service"].min_replicas
    max_replicas = var.services["booking-service"].max_replicas

    container {
      name   = "booking-service"
      image  = "${azurerm_container_registry.main.login_server}/booking-service:latest"
      cpu    = var.services["booking-service"].cpu
      memory = var.services["booking-service"].memory

      readiness_probe {
        http_get {
          path   = "/health/ready"
          port   = var.services["booking-service"].http_port
          scheme = "HTTP"
        }
        initial_delay = 5
        interval_seconds = 10
        timeout_seconds = 2
        failure_threshold = 2
        success_threshold = 1
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "TCP_HOST"
        value = "0.0.0.0"
      }

      env {
        name  = "TCP_PORT"
        value = tostring(var.services["booking-service"].tcp_port)
      }

      env {
        name  = "HTTP_PORT"
        value = tostring(var.services["booking-service"].http_port)
      }

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      # Service discovery
      env {
        name  = "CINEMA_HOST"
        value = "cinema-service"
      }

      env {
        name  = "CINEMA_PORT"
        value = tostring(var.services["cinema-service"].tcp_port)
      }

      env {
        name  = "USER_HOST"
        value = "user-service"
      }

      env {
        name  = "USER_PORT"
        value = tostring(var.services["user-service"].tcp_port)
      }

      env {
        name        = "REDIS_URL"
        secret_name = "redis-url"
      }

      # Email configuration
      env {
        name  = "EMAIL_ENABLED"
        value = tostring(var.email_config.enabled)
      }

      env {
        name  = "EMAIL_HOST"
        value = var.email_config.host
      }

      env {
        name  = "EMAIL_PORT"
        value = tostring(var.email_config.port)
      }

      env {
        name  = "EMAIL_SECURE"
        value = tostring(var.email_config.secure)
      }

      env {
        name  = "EMAIL_USER"
        value = var.email_config.user
      }

      env {
        name        = "EMAIL_PASSWORD"
        secret_name = "email-password"
      }

      env {
        name  = "EMAIL_FROM"
        value = var.email_config.from
      }

      # VNPay configuration
      env {
        name  = "VNPAY_TMN_CODE"
        value = var.vnpay_config.tmn_code
      }

      env {
        name        = "VNPAY_HASH_SECRET"
        secret_name = "vnpay-hash-secret"
      }

      env {
        name  = "VNPAY_URL"
        value = var.vnpay_config.url
      }

      env {
        name  = "VNPAY_RETURN_URL"
        value = var.vnpay_config.return_url
      }

      env {
        name  = "VNPAY_API"
        value = var.vnpay_config.api_url
      }
    }
  }
}

# API Gateway
resource "azurerm_container_app" "api_gateway" {
  name                         = "api-gateway"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Multiple"
  tags                         = merge(var.tags, { Service = "api-gateway" })

  secret {
    name  = "clerk-secret-key"
    value = var.clerk_secret_key
  }

  secret {
    name  = "redis-url"
    value = var.redis_connection_string
  }

  secret {
    name  = "acr-password"
    value = azurerm_container_registry.main.admin_password
  }

  registry {
    server               = azurerm_container_registry.main.login_server
    username             = azurerm_container_registry.main.admin_username
    password_secret_name = "acr-password"
  }

  ingress {
    external_enabled = true
    target_port      = var.services["api-gateway"].http_port
    transport        = "http"
    
    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  template {
    min_replicas = var.services["api-gateway"].min_replicas
    max_replicas = var.services["api-gateway"].max_replicas

    container {
      name   = "api-gateway"
      image  = "${azurerm_container_registry.main.login_server}/api-gateway:latest"
      cpu    = var.services["api-gateway"].cpu
      memory = var.services["api-gateway"].memory

      readiness_probe {
        http_get {
          path   = "/api/health/ready"
          port   = var.services["api-gateway"].http_port
          scheme = "HTTP"
        }
        initial_delay = 5
        interval_seconds = 10
        timeout_seconds = 2
        failure_threshold = 2
        success_threshold = 1
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = tostring(var.services["api-gateway"].http_port)
      }

      env {
        name        = "CLERK_SECRET_KEY"
        secret_name = "clerk-secret-key"
      }

      # Service discovery - internal DNS names within Container Apps Environment
      env {
        name  = "USER_HOST"
        value = "user-service"
      }

      env {
        name  = "USER_PORT"
        value = tostring(var.services["user-service"].tcp_port)
      }

      env {
        name  = "MOVIE_HOST"
        value = "movie-service"
      }

      env {
        name  = "MOVIE_PORT"
        value = tostring(var.services["movie-service"].tcp_port)
      }

      env {
        name  = "CINEMA_HOST"
        value = "cinema-service"
      }

      env {
        name  = "CINEMA_PORT"
        value = tostring(var.services["cinema-service"].tcp_port)
      }

      env {
        name  = "BOOKING_HOST"
        value = "booking-service"
      }

      env {
        name  = "BOOKING_PORT"
        value = tostring(var.services["booking-service"].tcp_port)
      }

      env {
        name        = "REDIS_URL"
        secret_name = "redis-url"
      }

      # Health check
      liveness_probe {
        transport        = "HTTP"
        path             = "/api/health/live"
        port             = var.services["api-gateway"].http_port
        
        interval_seconds = 30
        timeout          = 5
        failure_count_threshold = 3
      }

   
   
      readiness_probe {
        transport        = "HTTP"
        path             = "/api/health/ready"
        port             = var.services["api-gateway"].http_port
   
        interval_seconds = 10
        timeout          = 5
        failure_count_threshold = 3
      }
    }
  }

  depends_on = [
    azurerm_container_app.user_service,
    azurerm_container_app.movie_service,
    azurerm_container_app.cinema_service,
    azurerm_container_app.booking_service
  ]
}
