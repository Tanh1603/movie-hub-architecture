# Runbook: Brute-Force Attack Surge

## Trigger
Alert: `BruteForceLockouts` (P1) fires → `brute_force_lockouts_total` > 10 in 1-minute window.
Cause: Multiple accounts being locked out simultaneously — credential stuffing or distributed brute-force attack.

## Impact
- **Blast radius**: Legitimate users get locked out for 5 minutes per account.
- Sustained attack can cause mass account lockout, degrading customer experience.
- Attacker may be attempting to find valid credentials — risk of account takeover if lockout threshold is bypassed.

## Diagnosis
1. Check Grafana **Active Brute Force Lockouts** gauge — current lockout count.
2. Query Prometheus: `sum by (endpoint) (increase(brute_force_lockouts_total[5m]))` — identify targeted endpoints.
3. Check api-gateway access logs — filter on `x-forwarded-for` for IP distribution pattern:
   - Single IP → simple brute force → block at WAF.
   - Distributed IPs → credential stuffing campaign → different response needed.
4. Check `auth_failures_total` breakdown by `reason` — `reason="invalid_token"` vs `reason="lockout"` ratio.
5. Assess if specific accounts are targeted (staff/admin) vs random (credential stuffing against customer base).

## Containment
1. **Block attacking IPs at WAF/CDN** if single-source or narrow IP range:
   - Add IP block rule in Cloudflare / AWS WAF.
   - Estimated containment: 2–5 minutes.
2. **For distributed attack (credential stuffing)**:
   - Temporarily increase lockout duration via `BRUTE_FORCE_LOCK_DURATION_SECONDS` env var (e.g., 300s → 900s).
   - Restart `api-gateway` to apply.
   - Consider enabling CAPTCHA at login endpoint if not active.
3. Alert `#on-call-security` via PagerDuty.
4. Alert `#security-alerts` Slack with attack type, scale (lockout count), and IP pattern.

## Recovery
1. Verify `brute_force_lockouts_total` rate drops to below alert threshold.
2. Identify any accounts that were successfully compromised — look for successful auth immediately after lockout release.
3. Force password reset for any accounts that received > 3 lockout cycles.
4. If staff/admin accounts were targeted: notify affected users and enforce MFA review.
5. Restore `BRUTE_FORCE_LOCK_DURATION_SECONDS` to normal once attack subsides.

## Post-mortem
- Consider IP-based rate limiting as an additional layer before account lockout triggers.
- Review threshold — if > 10 legitimate users were locked out, threshold may need tuning.
- Evaluate adding Slack/email notification to affected users upon lockout.
- Log findings in `docs/security/drill-log.md`.

## Owner
Security on-call

## Escalation
If targeted accounts are ADMIN: escalate immediately to security lead + CTO notification.

## SLA
- **P1** — 1 hour to containment. Reduce to **P0** if admin accounts are targeted.
