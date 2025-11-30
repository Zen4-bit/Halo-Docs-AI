/**
 * Unit tests for API error handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiClient, APIError } from '../lib/api-client';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('API Error Handling', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Network Errors', () => {
    it('should handle network failures gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient('/test')).rejects.toThrow('Network error');
    });

    it('should handle timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('timeout'));

      await expect(apiClient('/test')).rejects.toThrow('timeout');
    });

    it('should handle DNS resolution failures', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await expect(apiClient('/test')).rejects.toThrow('Failed to fetch');
    });
  });

  describe('HTTP Error Responses', () => {
    it('should handle 400 Bad Request errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ error: 'Bad request' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Bad request');
    });

    it('should handle 401 Unauthorized errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ error: 'Unauthorized' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Unauthorized');
    });

    it('should handle 403 Forbidden errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ error: 'Forbidden' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Forbidden');
    });

    it('should handle 404 Not Found errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ error: 'Not found' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Not found');
    });

    it('should handle 422 Unprocessable Entity errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ 
          error: 'Validation failed',
          details: { field: 'email', message: 'Invalid email format' }
        }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Validation failed');
    });

    it('should handle 500 Internal Server Error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ error: 'Internal server error' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Internal server error');
    });

    it('should handle 502 Bad Gateway errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 502,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ error: 'Bad gateway' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Bad gateway');
    });

    it('should handle 503 Service Unavailable errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ error: 'Service unavailable' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Service unavailable');
    });

    it('should handle 504 Gateway Timeout errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 504,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ error: 'Gateway timeout' }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Gateway timeout');
    });
  });

  describe('Response Parsing Errors', () => {
    it('should handle invalid JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => 'invalid json {',
      });

      await expect(apiClient('/test')).rejects.toThrow('Failed to parse JSON response');
    });

    it('should handle empty JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '',
      });

      const result = await apiClient('/test');
      expect(result).toBeNull();
    });

    it('should handle non-JSON error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'Internal server error',
      });

      await expect(apiClient('/test')).rejects.toThrow('Internal server error');
    });

    it('should handle empty error responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => '',
      });

      await expect(apiClient('/test')).rejects.toThrow('Unknown error');
    });
  });

  describe('Request Errors', () => {
    it('should handle request body serialization errors', async () => {
      const circularObj: any = { a: 1 };
      circularObj.self = circularObj;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify({ success: true }),
      });

      // This should not throw during the API call itself, but during JSON.stringify
      // The actual implementation would need to handle this case
      await expect(apiClient('/test', { method: 'POST', body: circularObj })).rejects.toThrow();
    });
  });

  describe('APIError Class', () => {
    it('should create APIError with correct properties', () => {
      const error = new APIError('Test error', 404, { detail: 'Not found' }, 'Friendly message');
      
      expect(error.message).toBe('Test error');
      expect(error.status).toBe(404);
      expect(error.data).toEqual({ detail: 'Not found' });
      expect(error.friendlyMessage).toBe('Friendly message');
      expect(error.name).toBe('APIError');
    });

    it('should provide default friendly message', () => {
      const error = new APIError('Test error', 500);
      
      expect(error.friendlyMessage).toBe('Something went wrong on our end. Please try again in a moment.');
    });

    it('should provide appropriate friendly messages for different status codes', () => {
      const notFoundError = new APIError('Not found', 404);
      expect(notFoundError.friendlyMessage).toBe("We couldn't find what you were looking for. Double-check the link or try again.");
      
      const unauthorizedError = new APIError('Unauthorized', 401);
      expect(unauthorizedError.friendlyMessage).toBe('Access denied. Please try again.');
      
      const validationError = new APIError('Validation failed', 422, { error: 'Invalid input' });
      expect(validationError.friendlyMessage).toBe('Invalid input');
    });
  });

  describe('Error Recovery', () => {
    it('should provide detailed error information for debugging', async () => {
      const errorData = {
        error: 'Validation failed',
        details: [
          { field: 'email', message: 'Invalid email format' },
          { field: 'password', message: 'Password too short' }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 422,
        headers: new Headers({ 'content-type': 'application/json' }),
        text: async () => JSON.stringify(errorData),
      });

      try {
        await apiClient('/test');
      } catch (error) {
        expect(error).toBeInstanceOf(APIError);
        expect((error as APIError).status).toBe(422);
        expect((error as APIError).data).toEqual(errorData);
      }
    });

    it('should handle rate limiting errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: new Headers({ 
          'content-type': 'application/json',
          'retry-after': '60'
        }),
        text: async () => JSON.stringify({ 
          error: 'Rate limit exceeded',
          retry_after: 60
        }),
      });

      await expect(apiClient('/test')).rejects.toThrow('Rate limit exceeded');
    });
  });
});