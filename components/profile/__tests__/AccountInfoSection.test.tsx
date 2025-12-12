// components/profile/__tests__/AccountInfoSection.test.tsx
// Tests for AccountInfoSection component - User account details with inline editing

import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { AccountInfoSection, AccountInfoSectionProps } from '../AccountInfoSection';

import type { User } from '@/types';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date: Date) => {
    // Simple mock that returns a predictable string
    const diff = Date.now() - date.getTime();
    if (diff < 86400000) return 'today';
    if (diff < 604800000) return 'about 3 days ago';
    if (diff < 2592000000) return 'about 2 weeks ago';
    return 'about 2 months ago';
  }),
}));

// Mock UI components
vi.mock('@/components/ui/glass/GlassCard', () => ({
  GlassCard: ({ children, className, elevated }: any) => (
    <div data-testid="glass-card" className={className} data-elevated={elevated}>
      {children}
    </div>
  ),
}));

vi.mock('@/components/ui/glass/GlassInput', () => ({
  GlassInput: ({ value, onChange, placeholder, type, autoComplete, showPasswordToggle }: any) => (
    <input
      type={type || 'text'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoComplete={autoComplete}
      data-show-password-toggle={showPasswordToggle}
      data-testid={type === 'password' ? 'password-input' : `input-${placeholder}`}
    />
  ),
}));

vi.mock('@/components/ui/glass/GlowButton', () => ({
  GlowButton: ({ children, onClick, disabled, variant }: any) => (
    <button onClick={onClick} disabled={disabled} data-variant={variant}>
      {children}
    </button>
  ),
}));

describe('AccountInfoSection', () => {
  const mockUser: User = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    tier: 'free',
    subscriptionStatus: 'active',
    subscriptionPeriod: null,
    reflectionCountThisMonth: 0,
    reflectionsToday: 0,
    lastReflectionDate: null,
    totalReflections: 0,
    clarifySessionsThisMonth: 0,
    totalClarifySessions: 0,
    currentMonthYear: '2025-01',
    cancelAtPeriodEnd: false,
    isCreator: false,
    isAdmin: false,
    isDemo: false,
    language: 'en',
    emailVerified: true,
    preferences: {
      notification_email: true,
      reflection_reminders: 'off',
      evolution_email: true,
      marketing_emails: false,
      default_tone: 'fusion',
      show_character_counter: true,
      reduce_motion_override: null,
      analytics_opt_in: true,
    },
    createdAt: new Date(Date.now() - 7776000000).toISOString(), // ~90 days ago
    lastSignInAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps: AccountInfoSectionProps = {
    user: mockUser,
    isEditingName: false,
    name: mockUser.name,
    onNameChange: vi.fn(),
    onEditNameStart: vi.fn(),
    onSaveName: vi.fn(),
    onCancelName: vi.fn(),
    isNameSaving: false,
    isEditingEmail: false,
    newEmail: '',
    emailPassword: '',
    onNewEmailChange: vi.fn(),
    onEmailPasswordChange: vi.fn(),
    onEditEmailStart: vi.fn(),
    onChangeEmail: vi.fn(),
    onCancelEmail: vi.fn(),
    isEmailChanging: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Basic Rendering Tests
  // --------------------------------------------------------------------------
  describe('basic rendering', () => {
    it('renders the account information header', () => {
      render(<AccountInfoSection {...defaultProps} />);
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });

    it('displays user name', () => {
      render(<AccountInfoSection {...defaultProps} />);
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    it('displays user email', () => {
      render(<AccountInfoSection {...defaultProps} />);
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('displays member since date with relative time', () => {
      render(<AccountInfoSection {...defaultProps} />);
      // The mock returns 'about 2 months ago' for ~90 days
      expect(screen.getByText(/about 2 months ago/i)).toBeInTheDocument();
    });

    it('displays Name label', () => {
      render(<AccountInfoSection {...defaultProps} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('displays Email label', () => {
      render(<AccountInfoSection {...defaultProps} />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    it('displays Member Since label', () => {
      render(<AccountInfoSection {...defaultProps} />);
      expect(screen.getByText('Member Since')).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // Name Editing Tests
  // --------------------------------------------------------------------------
  describe('name editing', () => {
    it('shows Edit button when not editing name', () => {
      render(<AccountInfoSection {...defaultProps} />);
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onEditNameStart when Edit button is clicked', () => {
      const onEditNameStart = vi.fn();
      render(<AccountInfoSection {...defaultProps} onEditNameStart={onEditNameStart} />);
      const editButton = screen.getAllByText('Edit')[0];
      fireEvent.click(editButton);
      expect(onEditNameStart).toHaveBeenCalledTimes(1);
    });

    it('shows name input when isEditingName is true', () => {
      render(<AccountInfoSection {...defaultProps} isEditingName={true} />);
      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    });

    it('shows Save button when editing name', () => {
      render(<AccountInfoSection {...defaultProps} isEditingName={true} />);
      expect(screen.getByText('Save')).toBeInTheDocument();
    });

    it('shows Cancel button when editing name', () => {
      render(<AccountInfoSection {...defaultProps} isEditingName={true} />);
      const cancelButtons = screen.getAllByText('Cancel');
      expect(cancelButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('calls onNameChange when name input value changes', () => {
      const onNameChange = vi.fn();
      render(
        <AccountInfoSection {...defaultProps} isEditingName={true} onNameChange={onNameChange} />
      );
      const input = screen.getByPlaceholderText('Your name');
      fireEvent.change(input, { target: { value: 'New Name' } });
      expect(onNameChange).toHaveBeenCalledWith('New Name');
    });

    it('calls onSaveName when Save button is clicked', () => {
      const onSaveName = vi.fn();
      render(<AccountInfoSection {...defaultProps} isEditingName={true} onSaveName={onSaveName} />);
      fireEvent.click(screen.getByText('Save'));
      expect(onSaveName).toHaveBeenCalledTimes(1);
    });

    it('calls onCancelName when Cancel button is clicked', () => {
      const onCancelName = vi.fn();
      render(
        <AccountInfoSection {...defaultProps} isEditingName={true} onCancelName={onCancelName} />
      );
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[0]);
      expect(onCancelName).toHaveBeenCalledTimes(1);
    });

    it('shows Saving... when isNameSaving is true', () => {
      render(<AccountInfoSection {...defaultProps} isEditingName={true} isNameSaving={true} />);
      expect(screen.getByText('Saving...')).toBeInTheDocument();
    });

    it('disables Save button when isNameSaving is true', () => {
      render(<AccountInfoSection {...defaultProps} isEditingName={true} isNameSaving={true} />);
      const saveButton = screen.getByText('Saving...');
      expect(saveButton).toBeDisabled();
    });

    it('disables Cancel button when isNameSaving is true', () => {
      render(<AccountInfoSection {...defaultProps} isEditingName={true} isNameSaving={true} />);
      const cancelButtons = screen.getAllByText('Cancel');
      expect(cancelButtons[0]).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // Email Editing Tests
  // --------------------------------------------------------------------------
  describe('email editing', () => {
    it('shows Change Email button when not editing email', () => {
      render(<AccountInfoSection {...defaultProps} />);
      expect(screen.getByText('Change Email')).toBeInTheDocument();
    });

    it('calls onEditEmailStart when Change Email button is clicked', () => {
      const onEditEmailStart = vi.fn();
      render(<AccountInfoSection {...defaultProps} onEditEmailStart={onEditEmailStart} />);
      fireEvent.click(screen.getByText('Change Email'));
      expect(onEditEmailStart).toHaveBeenCalledTimes(1);
    });

    it('shows new email input when isEditingEmail is true', () => {
      render(<AccountInfoSection {...defaultProps} isEditingEmail={true} />);
      expect(screen.getByPlaceholderText('New email address')).toBeInTheDocument();
    });

    it('shows password input when isEditingEmail is true', () => {
      render(<AccountInfoSection {...defaultProps} isEditingEmail={true} />);
      expect(screen.getByPlaceholderText('Current password (required)')).toBeInTheDocument();
    });

    it('shows Update Email button when editing email', () => {
      render(<AccountInfoSection {...defaultProps} isEditingEmail={true} />);
      expect(screen.getByText('Update Email')).toBeInTheDocument();
    });

    it('calls onNewEmailChange when email input value changes', () => {
      const onNewEmailChange = vi.fn();
      render(
        <AccountInfoSection
          {...defaultProps}
          isEditingEmail={true}
          onNewEmailChange={onNewEmailChange}
        />
      );
      const input = screen.getByPlaceholderText('New email address');
      fireEvent.change(input, { target: { value: 'new@example.com' } });
      expect(onNewEmailChange).toHaveBeenCalledWith('new@example.com');
    });

    it('calls onEmailPasswordChange when password input value changes', () => {
      const onEmailPasswordChange = vi.fn();
      render(
        <AccountInfoSection
          {...defaultProps}
          isEditingEmail={true}
          onEmailPasswordChange={onEmailPasswordChange}
        />
      );
      const input = screen.getByPlaceholderText('Current password (required)');
      fireEvent.change(input, { target: { value: 'mypassword' } });
      expect(onEmailPasswordChange).toHaveBeenCalledWith('mypassword');
    });

    it('calls onChangeEmail when Update Email button is clicked', () => {
      const onChangeEmail = vi.fn();
      render(
        <AccountInfoSection {...defaultProps} isEditingEmail={true} onChangeEmail={onChangeEmail} />
      );
      fireEvent.click(screen.getByText('Update Email'));
      expect(onChangeEmail).toHaveBeenCalledTimes(1);
    });

    it('calls onCancelEmail when Cancel button is clicked in email editing', () => {
      const onCancelEmail = vi.fn();
      render(
        <AccountInfoSection {...defaultProps} isEditingEmail={true} onCancelEmail={onCancelEmail} />
      );
      const cancelButtons = screen.getAllByText('Cancel');
      fireEvent.click(cancelButtons[0]);
      expect(onCancelEmail).toHaveBeenCalledTimes(1);
    });

    it('shows Updating... when isEmailChanging is true', () => {
      render(<AccountInfoSection {...defaultProps} isEditingEmail={true} isEmailChanging={true} />);
      expect(screen.getByText('Updating...')).toBeInTheDocument();
    });

    it('disables Update Email button when isEmailChanging is true', () => {
      render(<AccountInfoSection {...defaultProps} isEditingEmail={true} isEmailChanging={true} />);
      const updateButton = screen.getByText('Updating...');
      expect(updateButton).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // Demo User Tests
  // --------------------------------------------------------------------------
  describe('demo user restrictions', () => {
    const demoUser: User = {
      ...mockUser,
      isDemo: true,
    };

    it('disables Edit name button for demo users', () => {
      render(<AccountInfoSection {...defaultProps} user={demoUser} />);
      const editButton = screen.getAllByText('Edit')[0];
      expect(editButton).toBeDisabled();
    });

    it('disables Change Email button for demo users', () => {
      render(<AccountInfoSection {...defaultProps} user={demoUser} />);
      const changeEmailButton = screen.getByText('Change Email');
      expect(changeEmailButton).toBeDisabled();
    });
  });

  // --------------------------------------------------------------------------
  // Input Values Tests
  // --------------------------------------------------------------------------
  describe('input values', () => {
    it('displays the current name value in input when editing', () => {
      render(<AccountInfoSection {...defaultProps} isEditingName={true} name="Current Name" />);
      const input = screen.getByPlaceholderText('Your name') as HTMLInputElement;
      expect(input.value).toBe('Current Name');
    });

    it('displays the new email value in input when editing', () => {
      render(
        <AccountInfoSection {...defaultProps} isEditingEmail={true} newEmail="newemail@test.com" />
      );
      const input = screen.getByPlaceholderText('New email address') as HTMLInputElement;
      expect(input.value).toBe('newemail@test.com');
    });

    it('displays the email password value in input when editing', () => {
      render(
        <AccountInfoSection
          {...defaultProps}
          isEditingEmail={true}
          emailPassword="secretpassword"
        />
      );
      const input = screen.getByPlaceholderText('Current password (required)') as HTMLInputElement;
      expect(input.value).toBe('secretpassword');
    });
  });

  // --------------------------------------------------------------------------
  // Date Handling Tests
  // --------------------------------------------------------------------------
  describe('date handling', () => {
    it('handles user with recent createdAt date', () => {
      const recentUser: User = {
        ...mockUser,
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      };
      render(<AccountInfoSection {...defaultProps} user={recentUser} />);
      // The mock should return 'today' for < 1 day difference
      expect(screen.getByText(/today|about/i)).toBeInTheDocument();
    });

    it('handles missing createdAt gracefully', () => {
      const userWithoutCreatedAt: User = {
        ...mockUser,
        createdAt: undefined as any,
      };
      // Should not throw
      render(<AccountInfoSection {...defaultProps} user={userWithoutCreatedAt} />);
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });
  });
});
