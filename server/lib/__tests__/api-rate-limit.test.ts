// server/lib/__tests__/api-rate-limit.test.ts
// Tests for API rate limiting helper

import { NextRequest, NextResponse } from 'next/server';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the rate-limiter module
const mockCheckRateLimit = vi.fn();
vi.mock('../rate-limiter', () => ({
  authRateLimiter: { limit: vi.fn() },
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
}));

import { withRateLimit } from '../api-rate-limit';

describe('API Rate Limit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withRateLimit', () => {
    it('should call handler when rate limit not exceeded', async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        remaining: 5,
        reset: Date.now() + 60000,
      });

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));

      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const response = await withRateLimit(request, mockHandler);

      expect(mockHandler).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('5');
    });

    it('should return 429 when rate limit exceeded', async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        reset: Date.now() + 30000,
      });

      const mockHandler = vi.fn();
      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1' },
      });

      const response = await withRateLimit(request, mockHandler);

      expect(mockHandler).not.toHaveBeenCalled();
      expect(response.status).toBe(429);
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0');
      expect(response.headers.get('Retry-After')).toBeDefined();
    });

    it('should use x-real-ip header when x-forwarded-for not present', async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        remaining: 10,
        reset: Date.now() + 60000,
      });

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));

      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-real-ip': '10.0.0.1' },
      });

      await withRateLimit(request, mockHandler);

      expect(mockCheckRateLimit).toHaveBeenCalledWith(expect.anything(), '10.0.0.1');
    });

    it('should use "unknown" when no IP headers present', async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        remaining: 10,
        reset: Date.now() + 60000,
      });

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));

      const request = new NextRequest('http://localhost/api/test');

      await withRateLimit(request, mockHandler);

      expect(mockCheckRateLimit).toHaveBeenCalledWith(expect.anything(), 'unknown');
    });

    it('should handle x-forwarded-for with multiple IPs', async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        remaining: 10,
        reset: Date.now() + 60000,
      });

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));

      const request = new NextRequest('http://localhost/api/test', {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1' },
      });

      await withRateLimit(request, mockHandler);

      expect(mockCheckRateLimit).toHaveBeenCalledWith(expect.anything(), '192.168.1.1');
    });

    it('should default to 60 second retry when reset not provided', async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: false,
        remaining: 0,
        reset: undefined,
      });

      const mockHandler = vi.fn();
      const request = new NextRequest('http://localhost/api/test');

      const response = await withRateLimit(request, mockHandler);

      expect(response.status).toBe(429);
      const body = await response.json();
      expect(body.retryAfter).toBe(60);
    });

    it('should return response without rate limit headers when remaining/reset undefined', async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        remaining: undefined,
        reset: undefined,
      });

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));

      const request = new NextRequest('http://localhost/api/test');

      const response = await withRateLimit(request, mockHandler);

      expect(response.status).toBe(200);
      expect(response.headers.get('X-RateLimit-Remaining')).toBeNull();
    });

    it('should preserve handler response status and body', async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        remaining: 3,
        reset: Date.now() + 60000,
      });

      const mockHandler = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: 'test' }), {
          status: 201,
          statusText: 'Created',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      const request = new NextRequest('http://localhost/api/test');

      const response = await withRateLimit(request, mockHandler);

      expect(response.status).toBe(201);
      expect(response.statusText).toBe('Created');
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('3');
    });

    it('should use custom limiter when provided', async () => {
      const customLimiter = { limit: vi.fn() };
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        remaining: 10,
        reset: Date.now() + 60000,
      });

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));

      const request = new NextRequest('http://localhost/api/test');

      await withRateLimit(request, mockHandler, customLimiter as any);

      expect(mockCheckRateLimit).toHaveBeenCalledWith(customLimiter, expect.any(String));
    });

    it('should use authRateLimiter by default', async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: true,
        remaining: 10,
        reset: Date.now() + 60000,
      });

      const mockHandler = vi.fn().mockResolvedValue(new Response('OK', { status: 200 }));

      const request = new NextRequest('http://localhost/api/test');

      await withRateLimit(request, mockHandler);

      expect(mockCheckRateLimit).toHaveBeenCalledWith(
        expect.objectContaining({ limit: expect.any(Function) }),
        expect.any(String)
      );
    });
  });
});
