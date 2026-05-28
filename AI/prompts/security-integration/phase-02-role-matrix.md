# Phase 02 Role Matrix

## Canonical Roles

- `CUSTOMER`
- `STAFF` (logical group: `ASSISTANT_MANAGER`, `TICKET_CLERK`, `CONCESSION_STAFF`, `USHER`, `PROJECTIONIST`, `CLEANER`, `SECURITY`)
- `CINEMA_MANAGER`
- `ADMIN` (formerly `SUPER_ADMIN`)

## Effective Access Matrix

- `CUSTOMER`:
  - own resources only (`booking`, `ticket`, `refund`, `payment`, `loyalty`)
- `STAFF`:
  - cinema-scoped operational reads/validations only
  - no global approval actions
- `CINEMA_MANAGER`:
  - all staff operational actions in assigned cinema scope
  - no global-only approval actions
- `ADMIN`:
  - global actions including approval endpoints

## Enforcement Source

- Guard policy: `apps/api-gateway/src/app/common/guard/role.guard.ts`
- Endpoint metadata: `@Roles(...)` + `@Permission(...)`
