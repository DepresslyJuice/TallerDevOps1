import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app, { mockUsers } from './app.js';

describe('Taller DevOps API Endpoints', () => {
  // Reset mockUsers back to original state before each test
  beforeEach(() => {
    mockUsers.length = 0;
    mockUsers.push(
      { id: '1', name: 'Alice Smith', email: 'alice@example.com', role: 'Admin' },
      { id: '2', name: 'Bob Jones', email: 'bob@example.com', role: 'User' },
      { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', role: 'User' }
    );
  });

  describe('GET /', () => {
    it('should return 200 OK and welcome message', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Welcome to the Taller DevOps API!');
    });
  });

  describe('GET /health', () => {
    it('should return 200 OK and UP status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'UP');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /ready', () => {
    it('should return 200 OK and READY status', async () => {
      const response = await request(app).get('/ready');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'READY');
      expect(response.body.checks).toHaveProperty('database', 'UP');
    });
  });

  describe('GET /metrics', () => {
    it('should return 200 OK and expose prometheus metrics', async () => {
      const response = await request(app).get('/metrics');
      expect(response.status).toBe(200);
      expect(response.text).toContain('http_requests_total');
      expect(response.text).toContain('app="taller-devops-api"');
    });
  });

  describe('GET /api/users', () => {
    it('should return 200 OK and list of users', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(3);
    });

    it('should support simulated latency', async () => {
      const start = Date.now();
      const response = await request(app).get('/api/users?latency=50');
      const duration = Date.now() - start;
      expect(response.status).toBe(200);
      expect(duration).toBeGreaterThanOrEqual(45);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return a user if it exists', async () => {
      const response = await request(app).get('/api/users/1');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        id: '1',
        name: 'Alice Smith',
        email: 'alice@example.com',
        role: 'Admin'
      });
    });

    it('should return 404 if user does not exist', async () => {
      const response = await request(app).get('/api/users/999');
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user and return 201 Created', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@example.com',
        role: 'User'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(newUser.name);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.role).toBe(newUser.role);

      // Verify user was added to store
      const listResponse = await request(app).get('/api/users');
      expect(listResponse.body.length).toBe(4);
    });

    it('should default role to User if not provided', async () => {
      const newUser = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.role).toBe('User');
    });

    it('should return 400 Bad Request if name is missing', async () => {
      const badUser = {
        email: 'no-name@example.com'
      };

      const response = await request(app)
        .post('/api/users')
        .send(badUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Name and email are required');
    });

    it('should return 400 Bad Request if email is missing', async () => {
      const badUser = {
        name: 'No Email'
      };

      const response = await request(app)
        .post('/api/users')
        .send(badUser);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Name and email are required');
    });
  });

  describe('GET /api/error', () => {
    it('should return 500 Internal Server Error', async () => {
      const response = await request(app).get('/api/error');
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error', 'Internal Server Error');
      expect(response.body).toHaveProperty('message', 'This is a simulated internal server error.');
    });
  });

  describe('Trace Header', () => {
    it('should generate a trace ID header if none is provided', async () => {
      const response = await request(app).get('/');
      expect(response.header).toHaveProperty('x-trace-id');
      expect(response.header['x-trace-id']).toMatch(/^[a-f0-9-]{36}$/);
    });

    it('should reuse provided trace ID from request headers', async () => {
      const customTraceId = 'custom-trace-123456';
      const response = await request(app)
        .get('/')
        .set('x-trace-id', customTraceId);
      expect(response.header).toHaveProperty('x-trace-id', customTraceId);
    });

    it('should reuse provided correlation ID from request headers', async () => {
      const customCorrelationId = 'custom-correlation-987654';
      const response = await request(app)
        .get('/')
        .set('x-correlation-id', customCorrelationId);
      expect(response.header).toHaveProperty('x-trace-id', customCorrelationId);
    });
  });
});
