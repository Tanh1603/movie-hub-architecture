/**
 * Security Metrics Baseline Collection Job
 * 
 * This script runs against a Prometheus endpoint to calculate baselines
 * for security metrics based on a 7-day observation period.
 * 
 * Usage:
 * ts-node scripts/security/collect-baselines.ts
 */

import axios from 'axios';

const PROMETHEUS_URL = process.env.PROMETHEUS_URL || 'http://localhost:9090';
const OBSERVATION_DAYS = 7;
const STEP_SECONDS = 3600; // 1-hour windows

interface QueryResult {
  metric: Record<string, string>;
  value?: [number, string];
  values?: [number, string][];
}

async function queryPrometheus(query: string): Promise<number[]> {
  try {
    const end = Math.floor(Date.now() / 1000);
    const start = end - (OBSERVATION_DAYS * 24 * 60 * 60);

    const response = await axios.get(`${PROMETHEUS_URL}/api/v1/query_range`, {
      params: {
        query,
        start,
        end,
        step: STEP_SECONDS,
      },
    });

    if (response.data.status !== 'success') {
      throw new Error(`Prometheus query failed: ${response.data.error}`);
    }

    const results: QueryResult[] = response.data.data.result;
    if (!results || results.length === 0) return [];

    // Flatten all values across series
    const allValues: number[] = [];
    for (const result of results) {
      if (result.values) {
        allValues.push(...result.values.map(v => parseFloat(v[1])));
      }
    }

    return allValues;
  } catch (error) {
    console.error(`Error querying Prometheus:`, error);
    return [];
  }
}

function calculatePercentile(data: number[], percentile: number): number {
  if (data.length === 0) return 0;
  const sorted = [...data].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[index];
}

function calculateStdDev(data: number[], mean: number): number {
  if (data.length === 0) return 0;
  const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
  return Math.sqrt(variance);
}

function calculateMean(data: number[]): number {
  if (data.length === 0) return 0;
  return data.reduce((acc, val) => acc + val, 0) / data.length;
}

async function run() {
  console.log(`Starting security metrics baselining (Observation period: ${OBSERVATION_DAYS} days)`);
  console.log(`Prometheus URL: ${PROMETHEUS_URL}\n`);

  const metricsToBaseline = [
    {
      name: 'auth_failures_total',
      query: 'sum(increase(auth_failures_total[1h]))',
      alertWindow: '5m',
      alertExpr: 'sum(rate(auth_failures_total[5m]))',
      severity: 'P2',
    },
    {
      name: 'brute_force_lockouts_total',
      query: 'sum(increase(brute_force_lockouts_total[1h]))',
      alertWindow: '1m',
      alertExpr: 'sum(increase(brute_force_lockouts_total[1m]))',
      severity: 'P1',
    },
    {
      name: 'webhook_signature_fail_total',
      query: 'sum(increase(webhook_signature_fail_total[1h]))',
      alertWindow: '5m',
      alertExpr: 'sum(increase(webhook_signature_fail_total[5m]))',
      severity: 'P1',
    },
    {
      name: 'webhook_replay_detected_total',
      query: 'sum(increase(webhook_replay_detected_total[1h]))',
      alertWindow: '5m',
      alertExpr: 'sum(increase(webhook_replay_detected_total[5m]))',
      severity: 'P1',
    },
    {
      name: 'clerk_sync_retry_exhausted_total',
      query: 'sum(increase(clerk_sync_retry_exhausted_total[1h]))',
      alertWindow: '5m',
      alertExpr: 'sum(increase(clerk_sync_retry_exhausted_total[5m]))',
      severity: 'P2',
    },
    {
      name: 'notification_outbox_dead_letter_total',
      query: 'sum(increase(notification_outbox_dead_letter_total[1h]))',
      alertWindow: '1h',
      alertExpr: 'sum(increase(notification_outbox_dead_letter_total[1h]))',
      severity: 'P3',
    },
  ];

  for (const metric of metricsToBaseline) {
    console.log(`\n── ${metric.name} [${metric.severity}] ──`);
    const values = await queryPrometheus(metric.query);

    if (values.length === 0) {
      console.log(`  No data found — metric may not have fired in the observation window.`);
      console.log(`  Alert expr:  ${metric.alertExpr}`);
      continue;
    }

    const mean = calculateMean(values);
    const p50 = calculatePercentile(values, 50);
    const p95 = calculatePercentile(values, 95);
    const p99 = calculatePercentile(values, 99);
    const stddev = calculateStdDev(values, mean);

    const recommendedThreshold = Math.ceil(p99 + (3 * stddev));

    console.log(`  Samples:    ${values.length}`);
    console.log(`  Mean:       ${mean.toFixed(2)}`);
    console.log(`  p50:        ${p50.toFixed(2)}`);
    console.log(`  p95:        ${p95.toFixed(2)}`);
    console.log(`  p99:        ${p99.toFixed(2)}`);
    console.log(`  StdDev:     ${stddev.toFixed(2)}`);
    console.log(`  Alert expr: ${metric.alertExpr}`);
    console.log(`  Alert win:  ${metric.alertWindow}`);
    console.log(`  => Recommended threshold: ${recommendedThreshold}  [update security.rules.yml]`);
  }
}

run().catch(console.error);
