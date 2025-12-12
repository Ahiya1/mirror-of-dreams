// test/mocks/paypal-sdk.tsx - PayPal SDK mock for testing PayPal checkout components
// Provides mock implementations of PayPalScriptProvider and PayPalButtons

import React from 'react';
import { vi } from 'vitest';

export interface MockPayPalButtonsProps {
  style?: Record<string, unknown>;
  createSubscription?: (
    data: unknown,
    actions: { subscription: { create: (config: unknown) => Promise<string> } }
  ) => Promise<string>;
  onApprove?: (data: { subscriptionID?: string | null }) => Promise<void>;
  onError?: (err: Record<string, unknown>) => void;
  onCancel?: () => void;
}

export const mockPayPalActions = {
  subscription: {
    create: vi.fn().mockResolvedValue('SUB-123456789'),
  },
};

export const MockPayPalScriptProvider = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

export const MockPayPalButtons = ({
  createSubscription,
  onApprove,
  onError,
  onCancel,
}: MockPayPalButtonsProps) => {
  const handleApprove = async () => {
    try {
      if (createSubscription) {
        await createSubscription({}, mockPayPalActions);
      }
      if (onApprove) {
        await onApprove({ subscriptionID: 'SUB-123456789' });
      }
    } catch {
      if (onError) {
        onError({ message: 'Test error' });
      }
    }
  };

  return (
    <div data-testid="paypal-buttons">
      <button onClick={handleApprove} data-testid="paypal-subscribe-button" type="button">
        PayPal Subscribe
      </button>
      <button
        onClick={() => onError?.({ message: 'PayPal error' })}
        data-testid="paypal-error-trigger"
        type="button"
      >
        Trigger Error
      </button>
      <button onClick={onCancel} data-testid="paypal-cancel-button" type="button">
        Cancel
      </button>
    </div>
  );
};
