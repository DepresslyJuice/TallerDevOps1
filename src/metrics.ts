import client from 'prom-client';

// Create a Registry to register the metrics
export const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'taller-devops-api'
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// Create custom metrics
export const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 10], // buckets for response time from 100ms to 10s
  registers: [register]
});
