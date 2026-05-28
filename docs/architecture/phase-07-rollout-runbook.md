# Phase 07 - Rollout Runbook

## Prerequisites

- Terraform infrastructure deployed with replica count = 2
- Services built and pushed to ACR

## Rollout Order (Sequential)

1. api-gateway
2. user-service
3. movie-service
4. cinema-service
5. booking-service

## Rollout Commands

```bash
# Deploy api-gateway
az containerapp update --name api-gateway --resource-group rg-moviehub-dev --image acr.azurecr.io/api-gateway:sha
sleep 60
STATUS=$(az containerapp show --name api-gateway --resource-group rg-moviehub-dev --query properties.runningStatus -o tsv)
if [ "$STATUS" != "Running" ]; then
  PREV=$(az containerapp revision list --name api-gateway --resource-group rg-moviehub-dev --query '[1].name' -o tsv)
  az containerapp revision set-traffic --name api-gateway --resource-group rg-moviehub-dev --revision-weight "$PREV=100"
  exit 1
fi

# Repeat for each service: user-service, movie-service, cinema-service, booking-service
az containerapp update --name <service> --resource-group rg-moviehub-dev --image acr.azurecr.io/<service>:sha
sleep 60
STATUS=$(az containerapp show --name <service> --resource-group rg-moviehub-dev --query properties.runningStatus -o tsv)
if [ "$STATUS" != "Running" ]; then
  PREV=$(az containerapp revision list --name <service> --resource-group rg-moviehub-dev --query '[1].name' -o tsv)
  az containerapp revision set-traffic --name <service> --resource-group rg-moviehub-dev --revision-weight "$PREV=100"
  exit 1
fi
```

## Rollback Policy

- If health probe fails (status != Running within 60s), rollback to previous revision
- Manual trigger: set traffic to previous revision 100%
