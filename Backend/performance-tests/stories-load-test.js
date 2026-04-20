/**
 * Performance Test: GET /public/stories
 * Tool: k6
 *
 * How to run:
 *   k6 run stories-load-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('error_rate');
const responseTime = new Trend('response_time');

export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '1m',  target: 50 },  // Hold at 50 users
    { duration: '30s', target: 0  },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95% of requests under 500ms
    error_rate: ['rate<0.05'],         // Less than 5% errors
  },
};

const BASE_URL = 'http://localhost:8080';

export default function () {
  // Task 1: GET all stories (75% of traffic)
  const allStories = http.get(`${BASE_URL}/public/stories`, {
    tags: { name: 'GET /public/stories' },
  });

  check(allStories, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  errorRate.add(allStories.status !== 200);
  responseTime.add(allStories.timings.duration);

  sleep(1);

  // Task 2: GET single story (25% of traffic)
  if (Math.random() < 0.25) {
    const singleStory = http.get(`${BASE_URL}/public/stories/1`, {
      tags: { name: 'GET /public/stories/{id}' },
    });

    check(singleStory, {
      'status is 200 or 404': (r) => [200, 404].includes(r.status),
    });

    sleep(1);
  }
}
