import winston from 'winston';
import { AsyncLocalStorage } from 'async_hooks';

// AsyncLocalStorage to maintain trace context across async boundaries
export const traceStorage = new AsyncLocalStorage<string>();

const traceFormat = winston.format((info) => {
  const traceId = traceStorage.getStore();
  if (traceId) {
    info.trace_id = traceId;
  }
  return info;
});

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    traceFormat(),
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'taller-devops-api' },
  transports: [
    new winston.transports.Console()
  ]
});
