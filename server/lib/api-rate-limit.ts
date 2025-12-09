// server/lib/api-rate-limit.ts - Rate limiting helper for Next.js API routes

import { NextRequest, NextResponse } from 'next/server';

import { authRateLimiter, checkRateLimit } from './rate-limiter';

import type { Ratelimit } from '@upstash/ratelimit';

/**
 * Get client IP from request headers
 */
function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Wrap an API route handler with rate limiting
 */
export async function withRateLimit(
  request: NextRequest,
  handler: () => Promise<Response>,
  limiter: Ratelimit | null = authRateLimiter
): Promise<Response> {
  const ip = getClientIp(request);
  const result = await checkRateLimit(limiter, ip);

  if (!result.success) {
    const retryAfter = result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60;

    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  // Call the actual handler
  const response = await handler();

  // Add rate limit headers to successful response
  if (result.remaining !== undefined && result.reset !== undefined) {
    const newHeaders = new Headers(response.headers);
    newHeaders.set('X-RateLimit-Remaining', String(result.remaining));
    newHeaders.set('X-RateLimit-Reset', String(result.reset));

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return response;
}
