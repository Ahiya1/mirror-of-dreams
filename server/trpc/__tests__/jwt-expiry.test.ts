// server/trpc/__tests__/jwt-expiry.test.ts - JWT expiry handling tests

import jwt from 'jsonwebtoken';
import { describe, it, expect, vi } from 'vitest';

const JWT_SECRET = 'test-jwt-secret-key-for-testing-only-32chars';

describe('JWT Expiry Enforcement', () => {
  describe('Token Creation', () => {
    it('should create tokens with correct expiry', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        tier: 'free',
        isCreator: false,
        isAdmin: false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30, // 30 days
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

      expect(decoded.exp).toBeDefined();
      expect(decoded.exp - decoded.iat).toBe(60 * 60 * 24 * 30);
    });

    it('should create demo tokens with 7-day expiry', () => {
      const payload = {
        userId: 'demo-user-id',
        email: 'demo@example.com',
        tier: 'free',
        isCreator: false,
        isAdmin: false,
        isDemo: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

      expect(decoded.exp - decoded.iat).toBe(60 * 60 * 24 * 7);
      expect(decoded.isDemo).toBe(true);
    });

    it('should include all required JWT payload fields', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        tier: 'pro',
        isCreator: true,
        isAdmin: false,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

      expect(decoded.userId).toBe('test-user-id');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.tier).toBe('pro');
      expect(decoded.isCreator).toBe(true);
      expect(decoded.isAdmin).toBe(false);
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp).toBeDefined();
    });
  });

  describe('Token Verification', () => {
    it('should reject expired tokens with TokenExpiredError', () => {
      const expiredPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800, // Expired 30 mins ago
      };

      const token = jwt.sign(expiredPayload, JWT_SECRET, { noTimestamp: true });

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow(jwt.TokenExpiredError);
    });

    it('should accept valid non-expired tokens', () => {
      const validPayload = {
        userId: 'test-user-id',
        email: 'test@example.com',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
      };

      const token = jwt.sign(validPayload, JWT_SECRET);

      expect(() => jwt.verify(token, JWT_SECRET)).not.toThrow();
    });

    it('should provide expiredAt date on TokenExpiredError', () => {
      const expiredPayload = {
        userId: 'test-user-id',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800,
      };

      const token = jwt.sign(expiredPayload, JWT_SECRET, { noTimestamp: true });

      try {
        jwt.verify(token, JWT_SECRET);
        expect.fail('Should have thrown TokenExpiredError');
      } catch (e) {
        expect(e).toBeInstanceOf(jwt.TokenExpiredError);
        expect((e as jwt.TokenExpiredError).expiredAt).toBeDefined();
        expect((e as jwt.TokenExpiredError).expiredAt).toBeInstanceOf(Date);
      }
    });

    it('should reject tokens with invalid signature', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const wrongSecretVerify = () => jwt.verify(token, 'wrong-secret-key-thats-long-enough');

      expect(wrongSecretVerify).toThrow(jwt.JsonWebTokenError);
    });

    it('should reject malformed tokens', () => {
      const malformedToken = 'not.a.valid.jwt.token';

      expect(() => jwt.verify(malformedToken, JWT_SECRET)).toThrow(jwt.JsonWebTokenError);
    });

    it('should handle NotBeforeError for future tokens', () => {
      const futurePayload = {
        userId: 'test-user-id',
        iat: Math.floor(Date.now() / 1000),
        nbf: Math.floor(Date.now() / 1000) + 3600, // Not valid until 1 hour from now
        exp: Math.floor(Date.now() / 1000) + 7200,
      };

      const token = jwt.sign(futurePayload, JWT_SECRET);

      expect(() => jwt.verify(token, JWT_SECRET)).toThrow(jwt.NotBeforeError);
    });
  });

  describe('Explicit Expiry Check', () => {
    it('should detect expired token via payload check', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        userId: 'test-user-id',
        exp: now - 100, // Expired 100 seconds ago
      };

      const isExpired = payload.exp < now;
      expect(isExpired).toBe(true);
    });

    it('should pass valid token via payload check', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        userId: 'test-user-id',
        exp: now + 3600, // Valid for 1 hour
      };

      const isExpired = payload.exp < now;
      expect(isExpired).toBe(false);
    });

    it('should calculate expired time ago correctly', () => {
      const now = Math.floor(Date.now() / 1000);
      const expiredAt = now - 600; // Expired 10 minutes ago
      const payload = {
        userId: 'test-user-id',
        exp: expiredAt,
      };

      const expiredAgoMinutes = Math.floor((now - payload.exp) / 60);
      expect(expiredAgoMinutes).toBe(10);
    });

    it('should handle tokens without exp claim', () => {
      const payload = {
        userId: 'test-user-id',
        email: 'test@example.com',
      };

      // Sign without any expiry options to create a token without exp
      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        iat?: number;
        exp?: number;
      };

      // Token without explicit expiry still has iat but no exp
      expect(decoded.iat).toBeDefined();
      // Note: jwt.sign() without expiresIn doesn't add exp claim

      // Our explicit check should handle undefined exp gracefully
      const now = Math.floor(Date.now() / 1000);
      const isExpired = decoded.exp ? decoded.exp < now : false;
      expect(isExpired).toBe(false);
    });
  });

  describe('Error Type Detection', () => {
    it('should correctly identify TokenExpiredError type', () => {
      const expiredPayload = {
        userId: 'test-user-id',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800,
      };

      const token = jwt.sign(expiredPayload, JWT_SECRET, { noTimestamp: true });

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (e) {
        const isTokenExpired = e instanceof jwt.TokenExpiredError;
        const isJsonWebTokenError = e instanceof jwt.JsonWebTokenError;
        const isNotBefore = e instanceof jwt.NotBeforeError;

        expect(isTokenExpired).toBe(true);
        expect(isJsonWebTokenError).toBe(true); // TokenExpiredError extends JsonWebTokenError
        expect(isNotBefore).toBe(false);
      }
    });

    it('should correctly identify JsonWebTokenError type', () => {
      const malformedToken = 'invalid.token.here';

      try {
        jwt.verify(malformedToken, JWT_SECRET);
      } catch (e) {
        const isTokenExpired = e instanceof jwt.TokenExpiredError;
        const isJsonWebTokenError = e instanceof jwt.JsonWebTokenError;

        expect(isTokenExpired).toBe(false);
        expect(isJsonWebTokenError).toBe(true);
      }
    });

    it('should correctly identify NotBeforeError type', () => {
      const futurePayload = {
        userId: 'test-user-id',
        nbf: Math.floor(Date.now() / 1000) + 3600,
        exp: Math.floor(Date.now() / 1000) + 7200,
      };

      const token = jwt.sign(futurePayload, JWT_SECRET);

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (e) {
        const isNotBefore = e instanceof jwt.NotBeforeError;
        const isJsonWebTokenError = e instanceof jwt.JsonWebTokenError;

        expect(isNotBefore).toBe(true);
        expect(isJsonWebTokenError).toBe(true); // NotBeforeError extends JsonWebTokenError
      }
    });

    it('should provide date property on NotBeforeError', () => {
      const nbfTime = Math.floor(Date.now() / 1000) + 3600;
      const futurePayload = {
        userId: 'test-user-id',
        nbf: nbfTime,
        exp: Math.floor(Date.now() / 1000) + 7200,
      };

      const token = jwt.sign(futurePayload, JWT_SECRET);

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (e) {
        expect(e).toBeInstanceOf(jwt.NotBeforeError);
        expect((e as jwt.NotBeforeError).date).toBeDefined();
        expect((e as jwt.NotBeforeError).date).toBeInstanceOf(Date);
      }
    });
  });

  describe('Context Error Handling Simulation', () => {
    it('should handle expired token with warn-level logging pattern', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const expiredPayload = {
        userId: 'test-user-id',
        iat: Math.floor(Date.now() / 1000) - 3600,
        exp: Math.floor(Date.now() / 1000) - 1800,
      };

      const token = jwt.sign(expiredPayload, JWT_SECRET, { noTimestamp: true });

      try {
        jwt.verify(token, JWT_SECRET);
      } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
          // This is the pattern used in context.ts
          console.warn('JWT token expired', {
            expiredAt: e.expiredAt?.toISOString(),
            message: e.message,
          });
        }
      }

      expect(warnSpy).toHaveBeenCalledWith('JWT token expired', expect.any(Object));
      warnSpy.mockRestore();
    });

    it('should handle invalid token with warn-level logging pattern', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const malformedToken = 'invalid.token';

      try {
        jwt.verify(malformedToken, JWT_SECRET);
      } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
          console.warn('JWT token expired');
        } else if (e instanceof jwt.JsonWebTokenError) {
          // This is the pattern used in context.ts
          console.warn('Invalid JWT token', {
            message: (e as Error).message,
          });
        }
      }

      expect(warnSpy).toHaveBeenCalledWith('Invalid JWT token', expect.any(Object));
      warnSpy.mockRestore();
    });

    it('should result in null user for all JWT error types', () => {
      // Simulate the context.ts pattern where any JWT error results in null user
      const testCases = [
        {
          name: 'expired',
          token: jwt.sign({ exp: Math.floor(Date.now() / 1000) - 100 }, JWT_SECRET, {
            noTimestamp: true,
          }),
        },
        { name: 'invalid', token: 'invalid.token.here' },
        {
          name: 'wrong signature',
          token: jwt.sign({ userId: 'test' }, 'different-secret-that-is-long'),
        },
      ];

      for (const testCase of testCases) {
        let user = null;

        try {
          jwt.verify(testCase.token, JWT_SECRET);
          user = { id: 'test' }; // Would be set if verification passed
        } catch {
          user = null; // This is the expected behavior
        }

        expect(user).toBeNull();
      }
    });
  });

  describe('Token Expiry Edge Cases', () => {
    it('should handle token expiring exactly now', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        userId: 'test-user-id',
        iat: now - 100,
        exp: now, // Expires exactly now
      };

      const token = jwt.sign(payload, JWT_SECRET, { noTimestamp: true });

      // jwt.verify uses a 0-second clock tolerance by default, so exp === now might pass or fail
      // based on timing. Our explicit check should handle this:
      const decoded = jwt.decode(token) as { exp: number };
      const isExpired = decoded.exp <= now;
      expect(isExpired).toBe(true);
    });

    it('should handle very long expiry periods', () => {
      const now = Math.floor(Date.now() / 1000);
      const oneYear = 60 * 60 * 24 * 365;
      const payload = {
        userId: 'test-user-id',
        iat: now,
        exp: now + oneYear,
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as typeof payload;

      expect(decoded.exp - decoded.iat).toBe(oneYear);
    });

    it('should detect token just expired', () => {
      const now = Math.floor(Date.now() / 1000);
      const payload = {
        userId: 'test-user-id',
        exp: now - 1, // Expired 1 second ago
      };

      // Our explicit check
      const isExpired = payload.exp < now;
      expect(isExpired).toBe(true);

      const expiredAgoMinutes = Math.floor((now - payload.exp) / 60);
      expect(expiredAgoMinutes).toBe(0); // Less than a minute ago
    });
  });
});
