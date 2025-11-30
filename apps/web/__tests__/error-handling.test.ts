/**
 * Unit tests for error handling and logging
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger, logComponentError, logAPIError, logPerformance, LogLevel } from '../lib/logger';

// Mock console methods
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

describe('Logger', () => {
  beforeEach(() => {
    // Clear logs before each test
    logger.clearLogs();
    logger.setLogLevel(LogLevel.DEBUG);

    // Mock console methods
    console.debug = vi.fn();
    console.info = vi.fn();
    console.warn = vi.fn();
    console.error = vi.fn();
  });

  afterEach(() => {
    // Restore original console methods
    console.debug = originalConsole.debug;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  });

  describe('Basic Logging', () => {
    it('should log debug messages', () => {
      logger.setLogLevel(LogLevel.DEBUG);
      logger.debug('Test debug message', { test: true });

      expect(console.debug).toHaveBeenCalledWith(
        expect.stringContaining('[DEBUG] Test debug message')
      );
    });

    it('should log info messages', () => {
      logger.info('Test info message', { test: true });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('[INFO] Test info message')
      );
    });

    it('should log warning messages', () => {
      const testError = new Error('Test error');
      logger.warn('Test warning message', { test: true }, testError);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('[WARN] Test warning message')
      );
    });

    it('should log error messages', () => {
      const testError = new Error('Test error');
      logger.error('Test error message', testError, { test: true });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[ERROR] Test error message')
      );
    });
  });

  describe('Log Level Filtering', () => {
    it('should filter logs based on log level', () => {
      logger.setLogLevel(LogLevel.WARN);

      logger.debug('Should not appear');
      logger.info('Should not appear');
      logger.warn('Should appear');
      logger.error('Should appear');

      expect(console.debug).not.toHaveBeenCalled();
      expect(console.info).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('Convenience Functions', () => {
    it('should log component errors correctly', () => {
      const error = new Error('Component failed');
      logComponentError('TestComponent', error, { prop: 'value' });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Component error in TestComponent')
      );
    });

    it('should log API errors correctly', () => {
      const error = new Error('API failed');
      logAPIError('/api/test', 'POST', 500, error, { userId: '123' });

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('API error: POST /api/test (500)')
      );
    });

    it('should log performance metrics correctly', () => {
      logPerformance('test-metric', 150, { component: 'Test' });

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Performance: test-metric took 150ms')
      );
    });
  });

  describe('Log Management', () => {
    it('should store and retrieve logs', () => {
      logger.info('Test message 1');
      logger.info('Test message 2');
      logger.info('Test message 3');

      const logs = logger.getLogs();
      expect(logs).toHaveLength(3);
      expect(logs[0]).toBeDefined();
      expect(logs[0]!.message).toBe('Test message 1');
    });

    it('should filter logs by level', () => {
      logger.debug('Debug message');
      logger.info('Info message');
      logger.error('Error message');

      const errorLogs = logger.getLogs(LogLevel.ERROR);
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0]).toBeDefined();
      expect(errorLogs[0]!.level).toBe(LogLevel.ERROR);
    });

    it('should limit log retrieval', () => {
      for (let i = 0; i < 10; i++) {
        logger.info(`Message ${i}`);
      }

      const logs = logger.getLogs(undefined, 5);
      expect(logs).toHaveLength(5);
      expect(logs[0]).toBeDefined();
      expect(logs[0]!.message).toBe('Message 5');
    });

    it('should clear logs', () => {
      logger.info('Test message');
      expect(logger.getLogs()).toHaveLength(1);

      logger.clearLogs();
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should export logs as JSON', () => {
      logger.info('Test message', { test: true });
      const exported = logger.exportLogs();

      expect(exported).toContain('Test message');
      expect(exported).toContain('"test":true');
    });
  });
});

describe('Error Handling Scenarios', () => {
  it('should handle network errors gracefully', () => {
    const networkError = new Error('Network error');
    logAPIError('/api/data', 'GET', 0, networkError, { retryCount: 3 });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Network error')
    );
  });

  it('should handle validation errors', () => {
    const validationError = new Error('Validation failed');
    logAPIError('/api/submit', 'POST', 422, validationError, {
      field: 'email',
      value: 'invalid-email'
    });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Validation failed')
    );
  });

  it('should handle timeout errors', () => {
    const timeoutError = new Error('Request timeout');
    logPerformance('api-request', 30000, { timeout: true });
    logAPIError('/api/slow', 'POST', 504, timeoutError);

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('30000ms')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Request timeout')
    );
  });
});

describe('Performance Monitoring', () => {
  it('should track component performance', () => {
    const startTime = Date.now();
    // Simulate some work
    for (let i = 0; i < 1000; i++) {
      Math.random();
    }
    const duration = Date.now() - startTime;

    logPerformance('heavy-computation', duration, { iterations: 1000 });

    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining(`Performance: heavy-computation took ${duration}ms`)
    );
  });

  it('should track API response times', () => {
    const responseTime = 250;
    logAPIError('/api/data', 'GET', 200, undefined, {
      responseTime,
      cached: false
    });

    // This would normally be a successful API call, but we're testing the logging
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('GET /api/data (200)')
    );
  });
});

describe('Error Recovery', () => {
  it('should log retry attempts', () => {
    const error = new Error('Temporary failure');

    // First attempt
    logAPIError('/api/data', 'GET', 500, error, { attempt: 1 });

    // Retry attempt
    logAPIError('/api/data', 'GET', 200, undefined, { attempt: 2, recovered: true });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('attempt: 1')
    );
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('attempt: 2')
    );
  });

  it('should log fallback mechanisms', () => {
    const primaryError = new Error('Primary service failed');
    logComponentError('PrimaryService', primaryError, { service: 'primary' });

    // Fallback to secondary service
    logger.info('Falling back to secondary service', { service: 'secondary' });

    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('PrimaryService')
    );
    expect(console.info).toHaveBeenCalledWith(
      expect.stringContaining('Falling back to secondary service')
    );
  });
});