import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { DreamCategoryIcon, DreamCategory } from '../DreamCategoryIcon';

describe('DreamCategoryIcon', () => {
  describe('rendering', () => {
    test('renders icon element', () => {
      render(<DreamCategoryIcon category="health" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('renders as span element', () => {
      render(<DreamCategoryIcon category="career" />);
      const element = screen.getByRole('img');
      expect(element.tagName).toBe('SPAN');
    });
  });

  describe('categories', () => {
    const categoryIcons: Record<DreamCategory, string> = {
      health: '****',
      career: '****',
      relationships: '****',
      financial: '****',
      personal_growth: '****',
      creative: '****',
      spiritual: '****',
      entrepreneurial: '****',
      educational: '****',
      other: '****',
    };

    const categoryLabels: Record<DreamCategory, string> = {
      health: 'Health & Fitness',
      career: 'Career',
      relationships: 'Relationships',
      financial: 'Financial',
      personal_growth: 'Personal Growth',
      creative: 'Creative',
      spiritual: 'Spiritual',
      entrepreneurial: 'Entrepreneurial',
      educational: 'Educational',
      other: 'Other',
    };

    Object.keys(categoryIcons).forEach((category) => {
      test(`renders ${category} category icon`, () => {
        render(<DreamCategoryIcon category={category as DreamCategory} />);
        const icon = screen.getByRole('img');
        expect(icon).toBeInTheDocument();
      });
    });

    Object.entries(categoryLabels).forEach(([category, label]) => {
      test(`${category} category has correct aria-label: ${label}`, () => {
        render(<DreamCategoryIcon category={category as DreamCategory} />);
        const icon = screen.getByRole('img');
        expect(icon).toHaveAttribute('aria-label', label);
      });
    });
  });

  describe('showLabel prop', () => {
    test('does not show label by default', () => {
      render(<DreamCategoryIcon category="health" />);
      expect(screen.queryByText('Health & Fitness')).not.toBeInTheDocument();
    });

    test('shows label when showLabel is true', () => {
      render(<DreamCategoryIcon category="health" showLabel />);
      expect(screen.getByText('Health & Fitness')).toBeInTheDocument();
    });

    test('renders icon and label in flex container when showLabel is true', () => {
      render(<DreamCategoryIcon category="career" showLabel />);
      const container = screen.getByText('Career').parentElement;
      expect(container).toHaveClass('flex');
      expect(container).toHaveClass('items-center');
      expect(container).toHaveClass('gap-2');
    });

    test('all categories show correct label', () => {
      const labels: Record<DreamCategory, string> = {
        health: 'Health & Fitness',
        career: 'Career',
        relationships: 'Relationships',
        financial: 'Financial',
        personal_growth: 'Personal Growth',
        creative: 'Creative',
        spiritual: 'Spiritual',
        entrepreneurial: 'Entrepreneurial',
        educational: 'Educational',
        other: 'Other',
      };

      Object.entries(labels).forEach(([category, label]) => {
        const { unmount } = render(
          <DreamCategoryIcon category={category as DreamCategory} showLabel />
        );
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('styling', () => {
    test('applies text-xl class to icon', () => {
      render(<DreamCategoryIcon category="creative" />);
      expect(screen.getByRole('img')).toHaveClass('text-xl');
    });

    test('applies text-xl class to icon when showLabel is true', () => {
      render(<DreamCategoryIcon category="creative" showLabel />);
      expect(screen.getByRole('img')).toHaveClass('text-xl');
    });
  });

  describe('custom className', () => {
    test('applies custom className without showLabel', () => {
      render(<DreamCategoryIcon category="spiritual" className="custom-class" />);
      expect(screen.getByRole('img')).toHaveClass('custom-class');
    });

    test('applies custom className with showLabel', () => {
      render(<DreamCategoryIcon category="spiritual" className="custom-class" showLabel />);
      const container = screen.getByText('Spiritual').parentElement;
      expect(container).toHaveClass('custom-class');
    });

    test('merges custom className with default classes', () => {
      render(<DreamCategoryIcon category="educational" className="ml-2" />);
      const icon = screen.getByRole('img');
      expect(icon).toHaveClass('ml-2');
      expect(icon).toHaveClass('text-xl');
    });
  });

  describe('accessibility', () => {
    test('has role="img"', () => {
      render(<DreamCategoryIcon category="financial" />);
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    test('has aria-label for accessibility', () => {
      render(<DreamCategoryIcon category="personal_growth" />);
      const icon = screen.getByRole('img');
      expect(icon).toHaveAttribute('aria-label');
      expect(icon.getAttribute('aria-label')).toBeTruthy();
    });
  });
});
