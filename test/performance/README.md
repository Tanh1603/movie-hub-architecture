# Performance Testing Documentation

## Overview

This directory contains k6 performance tests to validate the Movie Hub system's ability to handle concurrent users and sustained load.

## Test Configuration

### System Capacity Target

- **Maximum Concurrent Users**: 100 VUs (Virtual Users)
- **Total Test Duration**: 10 minutes
- **Test Tool**: k6 (Grafana)

### Test Scenarios

The test runs 5 sequential scenarios over 10 minutes:

#### 1. **Warm-up** (0-1 minute)

- **Duration**: 1 minute
- **Load**: 0 → 10 VUs
- **Purpose**: Prepare the system and eliminate cold start effects
- **Pattern**: Gradual ramp-up and hold

#### 2. **Average Load** (1-4 minutes)

- **Duration**: 3 minutes
- **Load**: 30 VUs (30% capacity)
- **Purpose**: Simulate normal day-to-day traffic
- **Pattern**: Ramp to 30, hold for 2 minutes, ramp down

#### 3. **Stress Test** (4-7 minutes)

- **Duration**: 3 minutes
- **Load**: 0 → 50 → 100 VUs (50% → 100% capacity)
- **Purpose**: Test system behavior at capacity
- **Pattern**: Gradual ramp to capacity, hold for 1 minute

#### 4. **Spike Test** (7-8.5 minutes)

- **Duration**: 1.5 minutes
- **Load**: Rapid spike to 80 VUs
- **Purpose**: Test system resilience to sudden traffic bursts
- **Pattern**: Fast ramp-up (10s), hold spike, ramp down

#### 5. **Soak Test** (8.5-10 minutes)

- **Duration**: 1.5 minutes
- **Load**: Constant 70 VUs (70% capacity)
- **Purpose**: Detect memory leaks and stability issues
- **Pattern**: Sustained constant load

## Performance Thresholds

The test validates the following success criteria:

| Metric                    | Threshold | Description                              |
| ------------------------- | --------- | ---------------------------------------- |
| `http_req_duration` (p95) | < 1000ms  | 95% of requests complete under 1 second  |
| `http_req_duration` (p99) | < 2000ms  | 99% of requests complete under 2 seconds |
| `http_req_failed`         | < 2%      | Less than 2% of HTTP requests fail       |
| `errors`                  | < 2%      | Less than 2% custom error rate           |

## User Journey Simulation

Each virtual user simulates a typical browsing journey:

1. **Browse Movies**

   - List movies (paginated)
   - View movie details
   - Check movie releases
   - Read movie reviews

2. **Browse Cinemas**

   - List all cinemas

3. **Think Time**
   - Random sleep between 1-3 seconds (simulating user reading/thinking)

## Running the Tests

### Prerequisites

```bash
# Install k6
# Windows (using Chocolatey)
choco install k6

# Or download from: https://k6.io/docs/get-started/installation/
```

### Execute Test

```bash
# Run with default configuration (localhost:3000)
k6 run test/performance/k6-script.js

# Run against a different environment
k6 run --env BASE_URL=https://api.moviehub.com/api/v1 test/performance/k6-script.js

# Run with results output to file
k6 run test/performance/k6-script.js > test/performance/results.log 2>&1
```

### Interpreting Results

#### Passing Test ✅

All thresholds are met:

```
✓ http_req_duration.........: p(95)=824ms < 1000ms
✓ http_req_duration.........: p(99)=1456ms < 2000ms
✓ http_req_failed...........: rate=0.5% < 2%
✓ errors....................: rate=0% < 2%
```

#### Failing Test ❌

One or more thresholds are exceeded:

```
✗ http_req_duration.........: p(95)=1234ms > 1000ms
✗ http_req_failed...........: rate=3.2% > 2%
```

## Test Results Analysis

### Key Metrics to Monitor

1. **Response Time**

   - `http_req_duration`: Average, median, p95, p99
   - Monitor for degradation under load

2. **Throughput**

   - `http_reqs`: Total requests per second
   - `iterations`: User journeys completed per second

3. **Error Rates**

   - `http_req_failed`: HTTP-level failures
   - `checks_failed`: Application-level assertion failures

4. **Resource Usage**
   - `data_received`: Network bandwidth consumed
   - `data_sent`: Network bandwidth sent

### What to Look For

- **Gradual degradation**: Normal - response times increase slightly with load
- **Sharp degradation**: Problem - sudden spike in response times indicates bottleneck
- **High error rates**: Critical - system cannot handle the load
- **Increasing response times during soak**: Potential memory leak

## Troubleshooting

### High Response Times

- Check database query performance
- Review API gateway/service logs
- Check for N+1 query issues
- Verify connection pool sizes

### High Error Rates

- Check service availability
- Review error logs for exceptions
- Verify rate limiting configurations
- Check timeout settings

### Memory Issues (Soak Test)

- Monitor heap usage during test
- Check for unclosed database connections
- Look for event listener leaks
- Review caching strategies

## Next Steps

To extend this test suite:

1. **Add Authentication Flows**

   - Login/logout scenarios
   - Token refresh handling

2. **Add Booking Flows**

   - Seat selection
   - Payment processing
   - Booking confirmation

3. **Add Search Scenarios**

   - Movie search by title
   - Cinema location search
   - Showtime filtering

4. **Add Admin Operations**
   - Content management
   - Report generation
   - User management

## Notes

- Test runs against development environment by default
- Adjust `BASE_URL` environment variable for other environments
- Consider increasing thresholds for production testing
- Use `--compatibility-mode=experimental_enhanced` for newer k6 features
