# Runbook: Auth Outage / JWKS Key Rotation Failure

## Trigger
Alert: `AuthFailuresSpike` (P2) fires → `auth_failures_total` rate spikes across all endpoints simultaneously.
Likely cause: Clerk JWKS cache stale after key rotation, or Clerk API unreachable.

## Impact
- **Blast radius**: 100% of authenticated requests fail with `401 Unauthorized`.
- All customer-facing and admin endpoints requiring `ClerkAuthGuard` are inaccessible.
- Payment flows, booking creation, and admin operations are blocked.

## Diagnosis
1. Check Grafana panel **Auth Failure Rate** — confirm spike is global (not scoped to one role/endpoint).
2. Query Prometheus: `sum by (reason) (rate(auth_failures_total[5m]))` — look for `reason="invalid_token"` dominating.
3. Check [Clerk Status Page](https://status.clerk.com) for active incident.
4. Attempt manual JWKS fetch: `curl https://<CLERK_ISSUER>/.well-known/jwks.json`
5. Check api-gateway logs for `TokenValidationService` errors — look for `JWKS fetch failed` or `certificate` errors.

## Containment
1. **Force JWKS cache refresh** — restart `api-gateway` pod/container to flush in-memory JWKS cache.
2. If Clerk is down: configure `CLERK_JWT_KEY` env var with the public key directly (bypasses JWKS fetch).
3. Verify connectivity: `curl -v https://<CLERK_ISSUER>/.well-known/jwks.json` from within the container network.
4. Alert `#security-alerts` Slack channel with incident status.

## Recovery
1. Confirm Clerk connectivity is restored via manual JWKS fetch.
2. Remove `CLERK_JWT_KEY` override if it was set (revert to dynamic JWKS).
3. Restart `api-gateway` to pick up fresh JWKS.
4. Inject 3 valid test tokens and verify `auth_failures_total` rate returns to baseline.
5. Confirm Grafana **Auth Failure Rate** panel trends down.

## Post-mortem
- Document root cause in incident log.
- Review `TokenValidationService` JWKS TTL — consider shorter TTL to detect rotation faster.
- Evaluate adding JWKS health check to `/health` endpoint.
- Update drill log at `docs/security/drill-log.md`.

## Owner
Security team / On-call engineer

## Escalation
If not contained in **15 minutes**: escalate to platform lead + Clerk support ticket.

## SLA
- **P1** — 15 minutes to containment, 1 hour to full resolution.
