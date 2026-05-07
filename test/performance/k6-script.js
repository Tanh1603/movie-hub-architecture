import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api/v1';

export const options = {
  scenarios: {
    // 1. Warm-up: Prepare the system (0-1m)
    warmup: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10 },
        { duration: '30s', target: 10 },
      ],
      gracefulStop: '10s',
    },

    // 2. Average Load: Normal traffic at 30% capacity (1-4m)
    average_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 30 },
        { duration: '2m', target: 30 }, // Sustained normal load
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '10s',
      startTime: '1m',
    },

    // 3. Stress Test: Push to capacity and beyond (4-7m)
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 50 }, // 50% capacity
        { duration: '30s', target: 100 }, // Target capacity
        { duration: '1m', target: 100 }, // Hold at capacity
        { duration: '30s', target: 0 },
      ],
      gracefulStop: '10s',
      startTime: '4m',
    },

    // 4. Spike Test: Sudden traffic burst (7-8.5m)
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 80 }, // Rapid spike
        { duration: '1m', target: 80 }, // Hold spike
        { duration: '20s', target: 0 },
      ],
      gracefulStop: '10s',
      startTime: '7m',
    },

    // 5. Soak Test: Sustained load at 70% capacity (8.5-10m)
    soak_test: {
      executor: 'constant-vus',
      vus: 70,
      duration: '1m30s',
      gracefulStop: '10s',
      startTime: '8m30s',
    },
  },
  thresholds: {
    // Performance thresholds
    http_req_duration: [
      'p(95)<1000', // 95th percentile under 1s
      'p(99)<2000', // 99th percentile under 2s
    ],
    http_req_failed: ['rate<0.02'], // Less than 2% failed requests
    errors: ['rate<0.02'], // Less than 2% errors
  },
};

export default function () {
  // Simulate a user journey
  group('Browsing Movies', () => {
    // 1. List Movies
    const listMoviesRes = http.get(`${BASE_URL}/movies?page=1&limit=10`);
    const isListSuccess = check(listMoviesRes, {
      'status is 200': (r) => r.status === 200,
      'content type is json': (r) =>
        r.headers['Content-Type'] &&
        r.headers['Content-Type'].includes('application/json'),
    });

    if (!isListSuccess) {
      errorRate.add(1);
    } else {
      // Extract a movie ID if possible (basic parsing)
      try {
        const body = JSON.parse(listMoviesRes.body);
        if (body.data && body.data.length > 0) {
          const movieId = body.data[0].id;

          // 2. Get Movie Details (and related data in parallel)
          const responses = http.batch([
            ['GET', `${BASE_URL}/movies/${movieId}`],
            ['GET', `${BASE_URL}/movies/${movieId}/releases`],
            ['GET', `${BASE_URL}/movies/${movieId}/reviews`],
          ]);

          check(responses[0], {
            'movie details status is 200': (r) => r.status === 200,
          });
          check(responses[1], {
            'movie releases status is 200': (r) => r.status === 200,
          });
          check(responses[2], {
            'movie reviews status is 200': (r) => r.status === 200,
          });
        }
      } catch (e) {
        // failed to parse or no data
      }
    }
  });

  sleep(1);

  group('Browsing Cinemas', () => {
    const listCinemasRes = http.get(`${BASE_URL}/cinemas`);
    check(listCinemasRes, {
      'status is 200': (r) => r.status === 200,
    });
  });

  sleep(Math.random() * 2 + 1); // Random think time 1-3s
}
