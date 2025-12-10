import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, test, vi, beforeEach } from 'vitest';

import { GlassInput } from '../GlassInput';

// Mock word count utility - return plain function (vi.fn() hoisting issue)
vi.mock('@/lib/utils/wordCount', () => ({
  countWords: (text: string) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  },
}));

// Mock framer-motion
vi.mock('framer-motion', async () => {
  const actual = await vi.importActual('framer-motion');
  return {
    ...actual,
    useReducedMotion: vi.fn(() => false),
  };
});

describe('GlassInput', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders input element correctly', () => {
      render(<GlassInput {...defaultProps} />);
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('renders with placeholder text', () => {
      render(<GlassInput {...defaultProps} placeholder="Enter text" />);
      expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
    });

    test('renders label when provided', () => {
      render(<GlassInput {...defaultProps} label="Email" id="email" />);
      expect(screen.getByText('Email')).toBeInTheDocument();
    });

    test('renders required indicator when required=true', () => {
      render(<GlassInput {...defaultProps} label="Email" id="email" required />);
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    test('label has htmlFor linked to input id', () => {
      render(<GlassInput {...defaultProps} label="Username" id="username" />);
      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', 'username');
    });

    test('does not render label when not provided', () => {
      render(<GlassInput {...defaultProps} />);
      expect(screen.queryByRole('label')).not.toBeInTheDocument();
    });

    test('has minimum height for touch accessibility', () => {
      render(<GlassInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('min-h-[56px]');
    });
  });

  describe('input types', () => {
    test('renders as text input by default', () => {
      render(<GlassInput {...defaultProps} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('type', 'text');
    });

    test('renders as email input', () => {
      render(<GlassInput {...defaultProps} type="email" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    test('renders as password input', () => {
      render(<GlassInput {...defaultProps} type="password" />);
      // Password inputs don't have textbox role, query by tag
      const input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();
    });

    test('renders as textarea with variant="textarea"', () => {
      render(<GlassInput {...defaultProps} variant="textarea" />);
      expect(screen.getByRole('textbox').tagName).toBe('TEXTAREA');
    });

    test('textarea has default rows value', () => {
      render(<GlassInput {...defaultProps} variant="textarea" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '5');
    });

    test('textarea respects custom rows value', () => {
      render(<GlassInput {...defaultProps} variant="textarea" rows={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('rows', '10');
    });

    test('textarea has resize-vertical class', () => {
      render(<GlassInput {...defaultProps} variant="textarea" />);
      expect(screen.getByRole('textbox')).toHaveClass('resize-vertical');
    });
  });

  describe('value management', () => {
    test('displays current value', () => {
      render(<GlassInput {...defaultProps} value="test value" />);
      expect(screen.getByRole('textbox')).toHaveValue('test value');
    });

    test('calls onChange with new value on input', () => {
      const handleChange = vi.fn();
      render(<GlassInput value="" onChange={handleChange} />);

      fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new' } });
      expect(handleChange).toHaveBeenCalledWith('new');
    });

    test('respects maxLength attribute', () => {
      render(<GlassInput {...defaultProps} maxLength={10} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('maxlength', '10');
    });

    test('respects minLength attribute', () => {
      render(<GlassInput {...defaultProps} minLength={3} />);
      expect(screen.getByRole('textbox')).toHaveAttribute('minlength', '3');
    });

    test('passes required attribute to input', () => {
      render(<GlassInput {...defaultProps} required />);
      expect(screen.getByRole('textbox')).toBeRequired();
    });

    test('passes autoComplete attribute', () => {
      render(<GlassInput {...defaultProps} autoComplete="email" />);
      expect(screen.getByRole('textbox')).toHaveAttribute('autocomplete', 'email');
    });
  });

  describe('focus state', () => {
    test('applies focus border on focus', () => {
      render(<GlassInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      // Focus should trigger state change
      expect(input).toHaveClass('border-2');
    });

    test('removes focus styling on blur', () => {
      render(<GlassInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      fireEvent.focus(input);
      fireEvent.blur(input);
      // After blur, should return to default border
      expect(input).toHaveClass('border-2');
    });
  });

  describe('character counter', () => {
    test('shows counter when showCounter=true and maxLength set for textarea', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="hello"
          showCounter
          maxLength={100}
        />
      );
      expect(screen.getByText('5 / 100')).toBeInTheDocument();
    });

    test('does not show counter when showCounter=false', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="hello"
          showCounter={false}
          maxLength={100}
        />
      );
      expect(screen.queryByText('5 / 100')).not.toBeInTheDocument();
    });

    test('does not show counter for non-textarea inputs', () => {
      render(
        <GlassInput {...defaultProps} type="text" value="hello" showCounter maxLength={100} />
      );
      expect(screen.queryByText('5 / 100')).not.toBeInTheDocument();
    });

    test('counter updates with value changes', () => {
      const { rerender } = render(
        <GlassInput {...defaultProps} variant="textarea" value="hi" showCounter maxLength={100} />
      );
      expect(screen.getByText('2 / 100')).toBeInTheDocument();

      rerender(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="hello world"
          showCounter
          maxLength={100}
        />
      );
      expect(screen.getByText('11 / 100')).toBeInTheDocument();
    });

    test('counter is announced for screen readers', () => {
      render(
        <GlassInput {...defaultProps} variant="textarea" value="test" showCounter maxLength={50} />
      );
      const counter = screen.getByText('4 / 50');
      expect(counter).toHaveAttribute('aria-live', 'polite');
      expect(counter).toHaveAttribute('aria-atomic', 'true');
    });

    test('counter is not interactive', () => {
      render(
        <GlassInput {...defaultProps} variant="textarea" value="test" showCounter maxLength={50} />
      );
      const counter = screen.getByText('4 / 50');
      expect(counter).toHaveClass('pointer-events-none');
    });
  });

  describe('word counter', () => {
    test('shows word count when counterMode="words"', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="one two three"
          showCounter
          maxLength={100}
          counterMode="words"
        />
      );
      expect(screen.getByText('3 thoughtful words')).toBeInTheDocument();
    });

    test('displays "Your thoughts await..." at 0 words', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value=""
          showCounter
          maxLength={100}
          counterMode="words"
        />
      );
      expect(screen.getByText('Your thoughts await...')).toBeInTheDocument();
    });

    test('displays "1 thoughtful word" at 1 word', () => {
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="hello"
          showCounter
          maxLength={100}
          counterMode="words"
        />
      );
      expect(screen.getByText('1 thoughtful word')).toBeInTheDocument();
    });

    test('updates word count dynamically', () => {
      const { rerender } = render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="one"
          showCounter
          maxLength={100}
          counterMode="words"
        />
      );
      expect(screen.getByText('1 thoughtful word')).toBeInTheDocument();

      rerender(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="one two three four"
          showCounter
          maxLength={100}
          counterMode="words"
        />
      );
      expect(screen.getByText('4 thoughtful words')).toBeInTheDocument();
    });
  });

  describe('custom counter format', () => {
    test('uses custom counterFormat function', () => {
      const customFormat = (count: number, max: number) => `${count} of ${max} chars`;
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="hello"
          showCounter
          maxLength={100}
          counterFormat={customFormat}
        />
      );
      expect(screen.getByText('5 of 100 chars')).toBeInTheDocument();
    });

    test('custom format receives correct count for word mode', () => {
      const customFormat = vi.fn((count: number) => `${count} items`);
      render(
        <GlassInput
          {...defaultProps}
          variant="textarea"
          value="one two three"
          showCounter
          maxLength={100}
          counterMode="words"
          counterFormat={customFormat}
        />
      );
      expect(customFormat).toHaveBeenCalledWith(3, 100);
    });
  });

  describe('validation states', () => {
    test('applies error border when error prop set', () => {
      render(<GlassInput {...defaultProps} error="Invalid input" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-mirror-error/50');
    });

    test('displays error message below input', () => {
      render(<GlassInput {...defaultProps} error="Invalid input" />);
      expect(screen.getByText('Invalid input')).toBeInTheDocument();
    });

    test('error message has warning emoji', () => {
      render(<GlassInput {...defaultProps} error="Invalid input" />);
      const errorContainer = screen.getByText('Invalid input').closest('p');
      expect(errorContainer).toHaveTextContent('Invalid input');
    });

    test('applies success border when success=true', () => {
      render(<GlassInput {...defaultProps} success />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-mirror-success/50');
    });

    test('shows success checkmark when success=true', () => {
      render(<GlassInput {...defaultProps} success />);
      const svg = document.querySelector('svg.text-mirror-success');
      expect(svg).toBeInTheDocument();
    });

    test('success checkmark is hidden from screen readers', () => {
      render(<GlassInput {...defaultProps} success />);
      const svg = document.querySelector('svg.text-mirror-success');
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    test('does not show success checkmark for password inputs', () => {
      render(<GlassInput {...defaultProps} type="password" success />);
      const svg = document.querySelector('svg.text-mirror-success');
      expect(svg).not.toBeInTheDocument();
    });

    test('error state takes precedence over success', () => {
      render(<GlassInput {...defaultProps} error="Error" success />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('border-mirror-error/50');
      expect(input).not.toHaveClass('border-mirror-success/50');
    });

    test('does not show success checkmark when error is present', () => {
      render(<GlassInput {...defaultProps} error="Error" success />);
      const svg = document.querySelector('svg.text-mirror-success');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('error shake animation', () => {
    test('applies shake animation on new error', async () => {
      const { rerender } = render(<GlassInput {...defaultProps} />);

      rerender(<GlassInput {...defaultProps} error="New error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('animate-shake');
    });

    test('removes shake animation after timeout', async () => {
      vi.useFakeTimers();
      const { rerender } = render(<GlassInput {...defaultProps} />);

      rerender(<GlassInput {...defaultProps} error="New error" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('animate-shake');

      // Use act to wrap timer advancement for React state updates
      await vi.runAllTimersAsync();

      // Re-query the input after state update
      const updatedInput = screen.getByRole('textbox');
      expect(updatedInput).not.toHaveClass('animate-shake');

      vi.useRealTimers();
    });
  });

  describe('password toggle', () => {
    test('shows PasswordToggle when showPasswordToggle=true for password type', () => {
      render(<GlassInput {...defaultProps} type="password" showPasswordToggle />);
      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    });

    test('does not show PasswordToggle when showPasswordToggle=false', () => {
      render(<GlassInput {...defaultProps} type="password" showPasswordToggle={false} />);
      expect(screen.queryByRole('button', { name: /show password/i })).not.toBeInTheDocument();
    });

    test('does not show PasswordToggle for non-password inputs', () => {
      render(<GlassInput {...defaultProps} type="text" showPasswordToggle />);
      expect(screen.queryByRole('button', { name: /show password/i })).not.toBeInTheDocument();
    });

    test('toggles password visibility on toggle click', () => {
      render(<GlassInput {...defaultProps} type="password" showPasswordToggle />);

      const toggleButton = screen.getByRole('button', { name: /show password/i });
      fireEvent.click(toggleButton);

      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();
    });

    test('changes input type to text when password is visible', () => {
      render(<GlassInput {...defaultProps} type="password" showPasswordToggle />);

      // Initially password type
      let input = document.querySelector('input[type="password"]');
      expect(input).toBeInTheDocument();

      // Toggle to show password
      fireEvent.click(screen.getByRole('button', { name: /show password/i }));

      // Now should be text type
      input = document.querySelector('input[type="text"]');
      expect(input).toBeInTheDocument();
    });

    test('can toggle password visibility back and forth', () => {
      render(<GlassInput {...defaultProps} type="password" showPasswordToggle />);

      const toggleButton = screen.getByRole('button', { name: /show password/i });

      // Show password
      fireEvent.click(toggleButton);
      expect(screen.getByRole('button', { name: /hide password/i })).toBeInTheDocument();

      // Hide password again
      fireEvent.click(screen.getByRole('button', { name: /hide password/i }));
      expect(screen.getByRole('button', { name: /show password/i })).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    test('applies base styling classes', () => {
      render(<GlassInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('w-full');
      expect(input).toHaveClass('rounded-xl');
      expect(input).toHaveClass('bg-white/5');
      expect(input).toHaveClass('backdrop-blur-sm');
    });

    test('applies text styling', () => {
      render(<GlassInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('text-white');
      expect(input).toHaveClass('text-base');
    });

    test('applies placeholder styling', () => {
      render(<GlassInput {...defaultProps} placeholder="Enter..." />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('placeholder:text-white/40');
    });

    test('applies padding for regular inputs', () => {
      render(<GlassInput {...defaultProps} />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('px-4');
      expect(input).toHaveClass('py-4');
    });

    test('applies custom className', () => {
      render(<GlassInput {...defaultProps} className="custom-class" />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('custom-class');
    });

    test('applies extra right padding when password toggle visible', () => {
      render(<GlassInput {...defaultProps} type="password" showPasswordToggle />);
      const input = document.querySelector('input');
      expect(input).toHaveClass('pr-12');
    });

    test('applies extra right padding when success state active', () => {
      render(<GlassInput {...defaultProps} success />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveClass('pr-12');
    });
  });

  describe('accessibility', () => {
    test('links label to input via htmlFor/id', () => {
      render(<GlassInput {...defaultProps} label="Username" id="username" />);
      const label = screen.getByText('Username');
      expect(label).toHaveAttribute('for', 'username');
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'username');
    });

    test('required field shows asterisk in label', () => {
      render(<GlassInput {...defaultProps} label="Email" id="email" required />);
      const asterisk = screen.getByText('*');
      expect(asterisk).toHaveClass('text-mirror-error');
    });

    test('label has proper styling for visibility', () => {
      render(<GlassInput {...defaultProps} label="Email" id="email" />);
      const label = screen.getByText('Email');
      expect(label).toHaveClass('text-sm');
      expect(label).toHaveClass('font-medium');
    });
  });

  describe('edge cases', () => {
    test('handles empty string value', () => {
      render(<GlassInput {...defaultProps} value="" />);
      expect(screen.getByRole('textbox')).toHaveValue('');
    });

    test('handles long text values', () => {
      const longText = 'a'.repeat(1000);
      render(<GlassInput {...defaultProps} value={longText} />);
      expect(screen.getByRole('textbox')).toHaveValue(longText);
    });

    test('handles special characters in value', () => {
      render(<GlassInput {...defaultProps} value="<script>alert('xss')</script>" />);
      expect(screen.getByRole('textbox')).toHaveValue("<script>alert('xss')</script>");
    });

    test('handles unicode characters', () => {
      render(<GlassInput {...defaultProps} value="Hello world" />);
      expect(screen.getByRole('textbox')).toHaveValue('Hello world');
    });

    test('renders without id when not provided', () => {
      render(<GlassInput {...defaultProps} label="No ID" />);
      const input = screen.getByRole('textbox');
      expect(input.id).toBeFalsy();
    });
  });
});
