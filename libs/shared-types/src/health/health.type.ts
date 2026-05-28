/**
 * Health check response types for service readiness and liveness probes.
 * Shared library provides contracts ONLY.
 * Each service owns readiness composition logic.
 */

export interface HealthLiveResponse {
  status: string;
  timestamp: string; // ISO8601
}

export interface HealthCheckDependency {
  name: string;
  status: 'UP' | 'DOWN';
}

export interface HealthReadyResponse {
  status: string;
  timestamp: string; // ISO8601
  dependencies: HealthCheckDependency[];
}

export interface HealthCheckError {
  code: string;
  message: string;
}
