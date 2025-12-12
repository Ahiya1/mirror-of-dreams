// server/lib/__tests__/email.test.ts
// Tests for email service using nodemailer with Gmail

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock nodemailer before imports
const mockSendMail = vi.fn();
const mockVerify = vi.fn();
const mockTransporter = {
  sendMail: mockSendMail,
  verify: mockVerify,
};

vi.mock('nodemailer', () => ({
  default: {
    createTransport: vi.fn(() => mockTransporter),
  },
}));

// Mock logger
vi.mock('../logger', () => ({
  emailLogger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// Store original env
const originalEnv = process.env;

describe('Email Service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      GMAIL_USER: 'test@gmail.com',
      GMAIL_APP_PASSWORD: 'test-app-password',
      NEXT_PUBLIC_APP_URL: 'https://mirror-of-dreams.com',
      NODE_ENV: 'test',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // =====================================================
  // sendPasswordResetEmail TESTS
  // =====================================================

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email successfully', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendPasswordResetEmail } = await import('../email');
      const result = await sendPasswordResetEmail('user@example.com', 'test-token', 'John');

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('should include correct reset link in email', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendPasswordResetEmail } = await import('../email');
      await sendPasswordResetEmail('user@example.com', 'test-token-123', 'John');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('test-token-123');
      expect(callArgs.text).toContain('test-token-123');
    });

    it('should send to correct recipient', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendPasswordResetEmail } = await import('../email');
      await sendPasswordResetEmail('recipient@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('recipient@example.com');
    });

    it('should include user name in email when provided', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendPasswordResetEmail } = await import('../email');
      await sendPasswordResetEmail('user@example.com', 'token', 'TestUser');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('TestUser');
    });

    it('should use default greeting when name not provided', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendPasswordResetEmail } = await import('../email');
      await sendPasswordResetEmail('user@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('Dreamer');
    });

    it('should have correct subject line', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendPasswordResetEmail } = await import('../email');
      await sendPasswordResetEmail('user@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Return to Your Dreams');
    });

    it('should return error on send failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('SMTP error'));

      const { sendPasswordResetEmail } = await import('../email');
      const result = await sendPasswordResetEmail('user@example.com', 'token');

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle non-Error throws', async () => {
      mockSendMail.mockRejectedValueOnce('string error');

      const { sendPasswordResetEmail } = await import('../email');
      const result = await sendPasswordResetEmail('user@example.com', 'token');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to send email');
    });
  });

  // =====================================================
  // sendVerificationEmail TESTS
  // =====================================================

  describe('sendVerificationEmail', () => {
    it('should send verification email successfully', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendVerificationEmail } = await import('../email');
      const result = await sendVerificationEmail('user@example.com', 'verify-token', 'Jane');

      expect(result.success).toBe(true);
      expect(mockSendMail).toHaveBeenCalledTimes(1);
    });

    it('should include correct verification link', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendVerificationEmail } = await import('../email');
      await sendVerificationEmail('user@example.com', 'verify-token-456');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('verify-token-456');
      expect(callArgs.html).toContain('/api/auth/verify-email');
    });

    it('should send to correct recipient', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendVerificationEmail } = await import('../email');
      await sendVerificationEmail('newuser@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.to).toBe('newuser@example.com');
    });

    it('should include user name when provided', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendVerificationEmail } = await import('../email');
      await sendVerificationEmail('user@example.com', 'token', 'NewUser');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('NewUser');
    });

    it('should have correct subject line', async () => {
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      const { sendVerificationEmail } = await import('../email');
      await sendVerificationEmail('user@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.subject).toContain('Begin Your Dream Journey');
    });

    it('should return error on send failure', async () => {
      mockSendMail.mockRejectedValueOnce(new Error('Connection failed'));

      const { sendVerificationEmail } = await import('../email');
      const result = await sendVerificationEmail('user@example.com', 'token');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Connection failed');
    });
  });

  // =====================================================
  // generateToken TESTS
  // =====================================================

  describe('generateToken', () => {
    it('should generate a 64 character hex string', async () => {
      const { generateToken } = await import('../email');
      const token = generateToken();

      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it('should generate unique tokens', async () => {
      const { generateToken } = await import('../email');
      const tokens = new Set();

      for (let i = 0; i < 100; i++) {
        tokens.add(generateToken());
      }

      expect(tokens.size).toBe(100);
    });
  });

  // =====================================================
  // generateResetToken TESTS (alias)
  // =====================================================

  describe('generateResetToken', () => {
    it('should be an alias for generateToken', async () => {
      const { generateToken, generateResetToken } = await import('../email');

      expect(typeof generateResetToken).toBe('function');
      // Both should produce valid tokens
      const token1 = generateToken();
      const token2 = generateResetToken();

      expect(token1).toHaveLength(64);
      expect(token2).toHaveLength(64);
    });
  });

  // =====================================================
  // getTokenExpiration TESTS
  // =====================================================

  describe('getTokenExpiration', () => {
    it('should return a Date object', async () => {
      const { getTokenExpiration } = await import('../email');
      const expiration = getTokenExpiration();

      expect(expiration).toBeInstanceOf(Date);
    });

    it('should return a date 1 hour in the future', async () => {
      const { getTokenExpiration } = await import('../email');
      const before = Date.now();
      const expiration = getTokenExpiration();
      const after = Date.now();

      const oneHourInMs = 60 * 60 * 1000;

      expect(expiration.getTime()).toBeGreaterThanOrEqual(before + oneHourInMs - 1000);
      expect(expiration.getTime()).toBeLessThanOrEqual(after + oneHourInMs + 1000);
    });
  });

  // =====================================================
  // getVerificationTokenExpiration TESTS
  // =====================================================

  describe('getVerificationTokenExpiration', () => {
    it('should return a Date object', async () => {
      const { getVerificationTokenExpiration } = await import('../email');
      const expiration = getVerificationTokenExpiration();

      expect(expiration).toBeInstanceOf(Date);
    });

    it('should return a date 24 hours in the future', async () => {
      const { getVerificationTokenExpiration } = await import('../email');
      const before = Date.now();
      const expiration = getVerificationTokenExpiration();
      const after = Date.now();

      const twentyFourHoursInMs = 24 * 60 * 60 * 1000;

      expect(expiration.getTime()).toBeGreaterThanOrEqual(before + twentyFourHoursInMs - 1000);
      expect(expiration.getTime()).toBeLessThanOrEqual(after + twentyFourHoursInMs + 1000);
    });
  });

  // =====================================================
  // EMAIL TEMPLATE TESTS
  // =====================================================

  describe('Email Templates', () => {
    describe('password reset template', () => {
      it('should include HTML and text versions', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

        const { sendPasswordResetEmail } = await import('../email');
        await sendPasswordResetEmail('user@example.com', 'token');

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.html).toBeDefined();
        expect(callArgs.text).toBeDefined();
      });

      it('should include security warning', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

        const { sendPasswordResetEmail } = await import('../email');
        await sendPasswordResetEmail('user@example.com', 'token');

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.html).toContain("didn't request");
      });

      it('should include expiry notice', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

        const { sendPasswordResetEmail } = await import('../email');
        await sendPasswordResetEmail('user@example.com', 'token');

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.html).toContain('1 hour');
      });
    });

    describe('verification template', () => {
      it('should include HTML and text versions', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

        const { sendVerificationEmail } = await import('../email');
        await sendVerificationEmail('user@example.com', 'token');

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.html).toBeDefined();
        expect(callArgs.text).toBeDefined();
      });

      it('should include expiry notice (24 hours)', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

        const { sendVerificationEmail } = await import('../email');
        await sendVerificationEmail('user@example.com', 'token');

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.html).toContain('24 hours');
      });

      it('should include features list', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

        const { sendVerificationEmail } = await import('../email');
        await sendVerificationEmail('user@example.com', 'token');

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.html).toContain('What Dreams Await');
      });
    });

    describe('branding', () => {
      it('should include Mirror of Dreams branding', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

        const { sendPasswordResetEmail } = await import('../email');
        await sendPasswordResetEmail('user@example.com', 'token');

        const callArgs = mockSendMail.mock.calls[0][0];
        expect(callArgs.html).toContain('Mirror of Dreams');
        expect(callArgs.from).toContain('Mirror of Dreams');
      });

      it('should include copyright year', async () => {
        mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

        const { sendPasswordResetEmail } = await import('../email');
        await sendPasswordResetEmail('user@example.com', 'token');

        const callArgs = mockSendMail.mock.calls[0][0];
        const currentYear = new Date().getFullYear().toString();
        expect(callArgs.html).toContain(currentYear);
      });
    });
  });

  // =====================================================
  // APP URL FALLBACK TESTS
  // =====================================================

  describe('App URL resolution', () => {
    it('should use NEXT_PUBLIC_APP_URL when available', async () => {
      process.env.NEXT_PUBLIC_APP_URL = 'https://custom-domain.com';
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      vi.resetModules();
      const { sendPasswordResetEmail } = await import('../email');
      await sendPasswordResetEmail('user@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('https://custom-domain.com');
    });

    it('should fallback to VERCEL_URL when NEXT_PUBLIC_APP_URL not set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      process.env.VERCEL_URL = 'vercel-app.vercel.app';
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      vi.resetModules();
      const { sendPasswordResetEmail } = await import('../email');
      await sendPasswordResetEmail('user@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('https://vercel-app.vercel.app');
    });

    it('should fallback to localhost when no URLs set', async () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      delete process.env.VERCEL_URL;
      mockSendMail.mockResolvedValueOnce({ messageId: 'test-id' });

      vi.resetModules();
      const { sendPasswordResetEmail } = await import('../email');
      await sendPasswordResetEmail('user@example.com', 'token');

      const callArgs = mockSendMail.mock.calls[0][0];
      expect(callArgs.html).toContain('http://localhost:3000');
    });
  });
});
