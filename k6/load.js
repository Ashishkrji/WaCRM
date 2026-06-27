import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // simulate ramp-up of traffic from 1 to 50 users over 30 seconds
    { duration: '1m', target: 50 },   // stay at 50 users for 1 minute
    { duration: '30s', target: 0 },   // ramp-down to 0 users
  ],
};

export default function () {
  const res = http.get('http://127.0.0.1:3000/api/health'); // Assuming a health endpoint exists
  
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
