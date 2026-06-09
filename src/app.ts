import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { logger, traceStorage } from './logger.js';
import { register, httpRequestCounter, httpRequestDurationMicroseconds } from './metrics.js';

const app = express();

app.use(cors());
app.use(express.json());

// Trace ID middleware: extracts from header (X-Trace-ID or X-Correlation-ID) or generates a new one
app.use((req: Request, res: Response, next: NextFunction) => {
  const traceId = (req.header('x-trace-id') || req.header('x-correlation-id') || uuidv4()) as string;
  res.setHeader('x-trace-id', traceId);

  // Run subsequent middlewares and routes in the AsyncLocalStorage trace context
  traceStorage.run(traceId, () => {
    next();
  });
});

// Logging and metrics middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime();
  const { method, originalUrl } = req;

  logger.info(`Incoming request: ${method} ${originalUrl}`, {
    method,
    url: originalUrl,
    ip: req.ip,
  });

  res.on('finish', () => {
    const diff = process.hrtime(start);
    const durationInSeconds = diff[0] + diff[1] / 1e9;
    const statusCode = res.statusCode;

    // Track metrics
    // Skip /metrics, /health, /ready from standard metrics tracker if desired, or keep them.
    // Usually we track them but filter in Grafana, or track only api routes. Let's record them.
    // Match route patterns to avoid high cardinality in metrics (e.g., /api/users/123 -> /api/users/:id)
    let route = originalUrl.split('?')[0];
    if (route.startsWith('/api/users/') && route.split('/').length === 4) {
      route = '/api/users/:id';
    }

    httpRequestCounter.labels(method, route, statusCode.toString()).inc();
    httpRequestDurationMicroseconds.labels(method, route, statusCode.toString()).observe(durationInSeconds);

    logger.info(`Request completed: ${method} ${originalUrl} -> ${statusCode} (${(durationInSeconds * 1000).toFixed(2)}ms)`, {
      method,
      url: originalUrl,
      statusCode,
      duration_ms: durationInSeconds * 1000
    });
  });

  next();
});

// In-memory data store for the workshop
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const mockUsers: User[] = [
  { id: '1', name: 'Alice Smith', email: 'alice@example.com', role: 'Admin' },
  { id: '2', name: 'Bob Jones', email: 'bob@example.com', role: 'User' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'User' }
];

// --- Core Observability Routes ---

// Health check (Liveness probe)
app.get('/health', (req: Request, res: Response) => {
  // BUG: Incorrect status code breaks health check contract
  res.status(503).json({
    status: 'DOWN',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Readiness check (Readiness probe)
app.get('/ready', (req: Request, res: Response) => {
  // Simulate ready check (e.g., checking DB connection state)
  res.status(200).json({
    status: 'READY',
    checks: {
      database: 'UP',
      cache: 'UP'
    }
  });
});

// Prometheus Metrics Endpoint
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    logger.error('Failed to generate Prometheus metrics', { error: err });
    res.status(500).end(err);
  }
});

// --- API Application Routes ---

// Root welcome message
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the Taller DevOps API!',
    version: '1.1.0',
    environment: process.env.NODE_ENV || 'development',
    documentation: 'https://github.com/your-repo/taller-devops',
    endpoints: {
      health: '/health',
      ready: '/ready',
      metrics: '/metrics',
      users: '/api/users'
    }
  });
});

// GET users with optional latency simulation to demonstrate SLO/SLI alert rules
app.get('/api/users', async (req: Request, res: Response) => {
  const latency = req.query.latency ? parseInt(req.query.latency as string, 10) : 0;
  
  if (latency > 0) {
    logger.warn(`Simulating latency of ${latency}ms`);
    await new Promise(resolve => setTimeout(resolve, latency));
  }

  res.status(200).json(mockUsers);
});

// GET user by ID
app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = mockUsers.find(u => u.id === req.params.id);
  if (!user) {
    logger.warn(`User with id ${req.params.id} not found`);
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.status(200).json(user);
});

// POST new user
app.post('/api/users', (req: Request, res: Response) => {
  const { name, email, role } = req.body;
  if (!name || !email) {
    logger.warn('Validation failed: name and email are required');
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }

  const newUser: User = {
    id: (mockUsers.length + 1).toString(),
    name,
    email,
    role: role || 'User'
  };

  mockUsers.push(newUser);
  logger.info(`User created successfully: ${newUser.name} (ID: ${newUser.id})`);
  res.status(201).json(newUser);
});

// GET endpoint to simulate internal server errors (testing SLO/SLI alerting)
app.get('/api/error', (req: Request, res: Response) => {
  logger.error('Simulating internal server error (500) for alerts testing');
  throw new Error('This is a simulated internal server error.');
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Unhandled error occurred: ${err.message}`, {
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

export default app;
export { mockUsers };
