# ===========================================
# TERRAFORM OUTPUTS
# MovieHub Azure Infrastructure
# ===========================================

# ===== RESOURCE GROUP =====

output "resource_group_name" {
  description = "The name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "The location of the resource group"
  value       = azurerm_resource_group.main.location
}

# ===== CONTAINER REGISTRY =====

output "acr_login_server" {
  description = "The login server URL for the Azure Container Registry"
  value       = azurerm_container_registry.main.login_server
}

output "acr_admin_username" {
  description = "The admin username for the Azure Container Registry"
  value       = azurerm_container_registry.main.admin_username
}

output "acr_admin_password" {
  description = "The admin password for the Azure Container Registry"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

# ===== CONTAINER APPS ENVIRONMENT =====

output "aca_environment_id" {
  description = "The ID of the Container Apps Environment"
  value       = azurerm_container_app_environment.main.id
}

output "aca_environment_default_domain" {
  description = "The default domain of the Container Apps Environment"
  value       = azurerm_container_app_environment.main.default_domain
}

# ===== API GATEWAY =====

output "api_gateway_url" {
  description = "The public URL of the API Gateway"
  value       = "https://${azurerm_container_app.api_gateway.ingress[0].fqdn}"
}

output "api_gateway_fqdn" {
  description = "The FQDN of the API Gateway"
  value       = azurerm_container_app.api_gateway.ingress[0].fqdn
}

# ===== SERVICE URLS (Internal) =====

output "service_internal_urls" {
  description = "Internal URLs for all services"
  value = {
    user_service    = "user-service:${var.services["user-service"].tcp_port}"
    movie_service   = "movie-service:${var.services["movie-service"].tcp_port}"
    cinema_service  = "cinema-service:${var.services["cinema-service"].tcp_port}"
    booking_service = "booking-service:${var.services["booking-service"].tcp_port}"
    api_gateway     = "api-gateway:${var.services["api-gateway"].http_port}"
  }
}

# ===== LOG ANALYTICS =====

output "log_analytics_workspace_id" {
  description = "The ID of the Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.main.id
}

output "log_analytics_workspace_name" {
  description = "The name of the Log Analytics Workspace"
  value       = azurerm_log_analytics_workspace.main.name
}

# ===== DEPLOYMENT SUMMARY =====

output "deployment_summary" {
  description = "Summary of the deployment"
  value = <<-EOT
    ============================================
    MOVIEHUB DEPLOYMENT SUMMARY
    ============================================
    Environment: ${var.environment}
    Location: ${var.location}
    
    API Gateway URL: https://${azurerm_container_app.api_gateway.ingress[0].fqdn}
    
    ACR Login Server: ${azurerm_container_registry.main.login_server}
    
    Services Deployed:
    - api-gateway (external)
    - user-service (internal)
    - movie-service (internal)
    - cinema-service (internal)
    - booking-service (internal)
    
    Service Discovery:
    All services communicate via internal DNS names
    within the Container Apps Environment.
    ============================================
  EOT
}
