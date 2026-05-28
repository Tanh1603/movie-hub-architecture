import { createSecurityCounterProvider } from '@movie-hub/shared-metrics';
import { SECURITY_METRICS } from '@movie-hub/shared-types';

export const securityMetricProviders = [
  createSecurityCounterProvider(
    SECURITY_METRICS.AUTH_FAILURES,
    'Total number of authentication failures',
    ['reason']
  ),
  createSecurityCounterProvider(
    SECURITY_METRICS.BRUTE_FORCE_LOCKOUTS,
    'Total number of account lockouts due to brute force attempts',
    ['endpoint']
  ),
  createSecurityCounterProvider(
    SECURITY_METRICS.RBAC_AUTHORIZATION_DENIED,
    'Total number of RBAC authorization denials',
    ['role', 'resource']
  ),
];
