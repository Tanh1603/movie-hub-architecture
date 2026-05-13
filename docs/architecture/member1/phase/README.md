# Member 1 Phased Delivery Plan

## Ordered Phase List

1. `phase-01-shared-health-types.md`
2. `phase-02-gateway-health-endpoints.md`
3. `phase-03-booking-readiness-checks.md`
4. `phase-04-other-service-readiness.md`
5. `phase-05-probe-config-compose-docker.md`
6. `phase-06-graceful-shutdown.md`
7. `phase-07-replica-failover-rollout.md`
8. `phase-08-retry-timeout-resilience.md`
9. `phase-09a-postgresql-backup-restore.md`
   9.1 `phase-09b-cron-backup-retention.md`
10. `phase-10a-prometheus-grafana-setup.md`
    10.1 `phase-10b-metrics-instrumentation.md`
    10.2 `phase-10c-monitoring-alerts-dashboards.md`
    10.3 `phase-10d-incident-runbooks.md`

## Dependency Flow

```text
Phase 01 -> Phase 02 -> Phase 03 -> Phase 04 -> Phase 05
Phase 05 -> Phase 06 -> Phase 07
Phase 01 -> Phase 08
Phase 03 -> Phase 09A -> Phase 09B
Phase 03 -> Phase 10A
Phase 04 -> Phase 10A
Phase 07 -> Phase 10A
Phase 10A -> Phase 10B -> Phase 10C -> Phase 10D
```

## Execution Guidance

- Execute phases in order unless explicitly marked parallel-safe.
- Keep observability boundaries strict:
  - Phase 10A: infrastructure only.
  - Phase 10B: metrics instrumentation.
  - Phase 10C: dashboards and alerts.
  - Phase 10D: incident operations.
- Port boundary reminder:
  - `3001-3004` = TCP microservice ports.
  - `3005-3008` = HTTP health/metrics ports.

## Alignment Notes

- ADD/SAD observability attributes are implemented incrementally across 10A-10D.
- TEAM_TASK_DIVISION 1.5 maps to monitoring and alerting work split across these four phases.
