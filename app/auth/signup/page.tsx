'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import CosmicBackground from '@/components/shared/CosmicBackground';
import '@/styles/auth.css';

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
  const [passwordHint, setPasswordHint] = useState({
    text: '6+ characters',
    isValid: false,
  });

  const signupMutation = trpc.auth.signup.useMutation({
    onSuccess: () => {
      router.push('/dashboard');
    },
    onError: (error) => {
      setErrors({ submit: error.message });
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

    // Handle password validation
    if (name === 'password') {
      handlePasswordValidation(value);
    }
  };

  const handlePasswordValidation = (password: string) => {
    if (password.length === 0) {
      setPasswordHint({
        text: '6+ characters',
        isValid: false,
      });
    } else if (password.length >= 6) {
      setPasswordHint({
        text: 'Perfect!',
        isValid: true,
      });
    } else {
      setPasswordHint({
        text: `${6 - password.length} more`,
        isValid: false,
      });
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
    <div className="auth-screen">
      <CosmicBackground />

      <div className="auth-container">
        <h1 className="auth-title">Create Account</h1>

        {/* Free Badge */}
        <div className="free-badge">
          <span>✨</span>
          <span>Free Forever</span>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Name Field */}
          <div className="form-field">
            <label htmlFor="name" className="form-label">
              Your name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter your full name"
              value={formData.name}
              onChange={handleInputChange}
              required
              autoComplete="name"
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* Email Field */}
          <div className="form-field">
            <label htmlFor="email" className="form-label">
              Your email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email address"
              value={formData.email}
              onChange={handleInputChange}
              required
              autoComplete="email"
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          {/* Password Field */}
          <div className="form-field">
            <label htmlFor="password" className="form-label">
              Choose a password
            </label>
            <div className="password-container">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input password-input ${errors.password ? 'error' : ''}`}
                placeholder="Create a secure password"
                value={formData.password}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={togglePasswordVisibility}
                aria-label="Toggle password visibility"
              >
                <span>{showPassword ? '🙈' : '👁️'}</span>
              </button>
            </div>
            <div className={`password-hint ${passwordHint.isValid ? 'valid' : ''}`}>
              {passwordHint.text}
            </div>
            {errors.password && (
              <span className="error-message">{errors.password}</span>
            )}
          </div>

          {/* Confirm Password Field */}
          <div className="form-field">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm password
            </label>
            <div className="password-container">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                className={`form-input password-input ${
                  errors.confirmPassword ? 'error' : ''
                }`}
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                autoComplete="new-password"
                minLength={6}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleConfirmPasswordVisibility}
                aria-label="Toggle password visibility"
              >
                <span>{showConfirmPassword ? '🙈' : '👁️'}</span>
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="error-message">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="error-banner" role="alert">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={signupMutation.isPending}
          >
            {signupMutation.isPending ? (
              <span className="button-loading">
                <div className="loading-spinner" />
                <span>Creating...</span>
              </span>
            ) : (
              <span className="button-text">Create Free Account</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="auth-footer">
          <p className="signin-text">Already have an account?</p>
          <Link href="/auth/signin" className="switch-link">
            <span>🔑</span>
            <span>Sign in</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
