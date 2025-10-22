'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState({ text: '', type: '' });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      setMessage({ text: 'Account created! Redirecting...', type: 'success' });
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    },
    onError: (error) => {
      setErrors({ submit: error.message });
      setMessage({ text: error.message, type: 'error' });
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (message.text) {
      setMessage({ text: '', type: '' });
    }
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await signupMutation.mutateAsync({
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password,
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Auth Card */}
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
            <p className="text-white/60">Start your journey of self-discovery</p>
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">
              <span>✨</span>
              <span className="text-sm text-purple-300">Free Forever</span>
            </div>
          </div>

          {/* Messages */}
          {message.text && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${
                message.type === 'error'
                  ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                  : 'bg-green-500/20 border border-green-500/30 text-green-300'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">
                Your name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.name ? 'border-red-500/50' : 'border-white/10'
                } text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleInputChange}
                required
                autoComplete="name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-400">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">
                Your email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                  errors.email ? 'border-red-500/50' : 'border-white/10'
                } text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all`}
                placeholder="Enter your email address"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoComplete="email"
              />
              {errors.email && <p className="mt-1 text-sm text-red-400">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-white/80 mb-2">
                Choose a password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                    errors.password ? 'border-red-500/50' : 'border-white/10'
                  } text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all pr-12`}
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  <span className="text-xl">{showPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
              <div className="mt-1 text-xs text-white/40">
                {formData.password.length === 0
                  ? '6+ characters'
                  : formData.password.length >= 6
                  ? '✓ Perfect!'
                  : `${6 - formData.password.length} more`}
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-400">{errors.password}</p>}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-white/80 mb-2"
              >
                Confirm password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className={`w-full px-4 py-3 rounded-lg bg-white/5 border ${
                    errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'
                  } text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all pr-12`}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  autoComplete="new-password"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={toggleConfirmPasswordVisibility}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  <span className="text-xl">{showConfirmPassword ? '🙈' : '👁️'}</span>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={signupMutation.isPending}
            >
              {signupMutation.isPending ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </span>
              ) : (
                'Create Free Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm">
              Already have an account?{' '}
              <Link
                href="/auth/signin"
                className="text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        .min-h-screen {
          background: linear-gradient(135deg, #0f0f23 0%, #1a1a2e 25%, #16213e 50%, #0f0f23 100%);
        }
      `}</style>
    </div>
  );
}
