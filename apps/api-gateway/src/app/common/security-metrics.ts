import { makeCounterProvider } from '@willsoto/nestjs-prometheus';
import { SECURITY_METRICS } from '@movie-hub/shared-types';

export const securityMetricProviders = [
  makeCounterProvider({
    name: SECURITY_METRICS.AUTH_FAILURES,
    help: 'Total number of authentication failures',
    labelNames: ['reason'],
  }),
  makeCounterProvider({
    name: SECURITY_METRICS.BRUTE_FORCE_LOCKOUTS,
    help: 'Total number of account lockouts due to brute force attempts',
    labelNames: ['endpoint'],
  }),
  makeCounterProvider({
    name: SECURITY_METRICS.RBAC_AUTHORIZATION_DENIED,
    help: 'Total number of RBAC authorization denials',
    labelNames: ['role', 'resource'],
  }),
];
