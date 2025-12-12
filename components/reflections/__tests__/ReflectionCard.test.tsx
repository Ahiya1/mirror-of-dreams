// components/reflections/__tests__/ReflectionCard.test.tsx
// Tests for ReflectionCard component

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { ReflectionCard } from '../ReflectionCard';

describe('ReflectionCard', () => {
  const baseReflection = {
    id: 'ref-123',
    userId: 'user-1',
    dreamId: 'dream-1',
    title: 'My Dream',
    tone: 'gentle' as const,
    userInput: 'My thoughts...',
    aiResponse:
      '## Title\n\nThis is **bold** and *italic* text that provides insight into your dream journey.',
    wordCount: 150,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isPremium: false,
    tags: [],
    dream: 'I had a dream about flying over mountains.',
    plan: 'To explore the meaning of freedom in my life.',
    hasDate: 'yes' as const,
    dreamDate: new Date().toISOString(),
    relationship: 'Personal growth',
    offering: 'Insight into my subconscious',
    viewCount: 0,
    estimatedReadTime: null,
    rating: null,
    userFeedback: null,
  };

  describe('rendering', () => {
    it('renders as link to reflection detail', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.getByRole('link')).toHaveAttribute('href', '/reflections/ref-123');
    });

    it('renders dream title badge when provided', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.getByText('My Dream')).toBeInTheDocument();
    });

    it('does not render title badge when not provided', () => {
      const noTitle = { ...baseReflection, title: '' };
      render(<ReflectionCard reflection={noTitle} />);
      expect(screen.queryByText('My Dream')).not.toBeInTheDocument();
    });

    it('renders word count', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.getByText('150 words')).toBeInTheDocument();
    });

    it('formats large word counts with commas', () => {
      const largeCount = { ...baseReflection, wordCount: 1500 };
      render(<ReflectionCard reflection={largeCount} />);
      expect(screen.getByText('1,500 words')).toBeInTheDocument();
    });
  });

  describe('tone badge', () => {
    it('renders gentle tone badge', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.getByText('gentle')).toBeInTheDocument();
    });

    it('renders intense tone badge', () => {
      const intense = { ...baseReflection, tone: 'intense' as const };
      render(<ReflectionCard reflection={intense} />);
      expect(screen.getByText('intense')).toBeInTheDocument();
    });

    it('renders fusion tone badge', () => {
      const fusion = { ...baseReflection, tone: 'fusion' as const };
      render(<ReflectionCard reflection={fusion} />);
      expect(screen.getByText('fusion')).toBeInTheDocument();
    });
  });

  describe('premium indicator', () => {
    it('shows Premium badge when isPremium is true', () => {
      const premium = { ...baseReflection, isPremium: true };
      render(<ReflectionCard reflection={premium} />);
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('does not show Premium badge when isPremium is false', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.queryByText('Premium')).not.toBeInTheDocument();
    });
  });

  describe('AI response snippet', () => {
    it('strips markdown headings from snippet', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.queryByText('## Title')).not.toBeInTheDocument();
    });

    it('strips markdown bold from snippet', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      // Bold should be rendered as plain text
      const content = screen.getByText(/bold.*italic/);
      expect(content).toBeInTheDocument();
    });

    it('truncates snippet to 120 characters', () => {
      const longResponse = {
        ...baseReflection,
        aiResponse: 'A'.repeat(200),
      };
      render(<ReflectionCard reflection={longResponse} />);
      // Should end with ...
      expect(screen.getByText(/\.\.\.$/)).toBeInTheDocument();
    });
  });

  describe('read time', () => {
    it('shows read time when provided', () => {
      const withReadTime = { ...baseReflection, estimatedReadTime: 5 };
      render(<ReflectionCard reflection={withReadTime} />);
      expect(screen.getByText('5 min read')).toBeInTheDocument();
    });

    it('does not show read time when not provided', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
    });
  });

  describe('rating', () => {
    it('shows rating when provided', () => {
      const withRating = { ...baseReflection, rating: 8 };
      render(<ReflectionCard reflection={withRating} />);
      expect(screen.getByText('8/10')).toBeInTheDocument();
    });

    it('does not show rating when not provided', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.queryByText(/\/10/)).not.toBeInTheDocument();
    });
  });

  describe('tags', () => {
    it('renders tags when provided', () => {
      const withTags = { ...baseReflection, tags: ['growth', 'reflection', 'peace'] };
      render(<ReflectionCard reflection={withTags} />);
      expect(screen.getByText('growth')).toBeInTheDocument();
      expect(screen.getByText('reflection')).toBeInTheDocument();
      expect(screen.getByText('peace')).toBeInTheDocument();
    });

    it('shows only first 3 tags', () => {
      const manyTags = {
        ...baseReflection,
        tags: ['one', 'two', 'three', 'four', 'five'],
      };
      render(<ReflectionCard reflection={manyTags} />);
      expect(screen.getByText('one')).toBeInTheDocument();
      expect(screen.getByText('two')).toBeInTheDocument();
      expect(screen.getByText('three')).toBeInTheDocument();
      expect(screen.queryByText('four')).not.toBeInTheDocument();
    });

    it('shows +N more when more than 3 tags', () => {
      const manyTags = {
        ...baseReflection,
        tags: ['one', 'two', 'three', 'four', 'five'],
      };
      render(<ReflectionCard reflection={manyTags} />);
      expect(screen.getByText('+2 more')).toBeInTheDocument();
    });

    it('does not show tags section when empty', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.queryByText('+0 more')).not.toBeInTheDocument();
    });
  });

  describe('relative time', () => {
    it('shows Today for current date', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.getByText('Today')).toBeInTheDocument();
    });

    it('shows Yesterday for yesterday', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayReflection = {
        ...baseReflection,
        createdAt: yesterday.toISOString(),
      };
      render(<ReflectionCard reflection={yesterdayReflection} />);
      expect(screen.getByText('Yesterday')).toBeInTheDocument();
    });

    it('shows days ago for recent past', () => {
      const fiveDaysAgo = new Date();
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const pastReflection = {
        ...baseReflection,
        createdAt: fiveDaysAgo.toISOString(),
      };
      render(<ReflectionCard reflection={pastReflection} />);
      expect(screen.getByText('5 days ago')).toBeInTheDocument();
    });

    it('shows weeks ago for 1-4 weeks past', () => {
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const pastReflection = {
        ...baseReflection,
        createdAt: twoWeeksAgo.toISOString(),
      };
      render(<ReflectionCard reflection={pastReflection} />);
      expect(screen.getByText('2 weeks ago')).toBeInTheDocument();
    });

    it('shows months ago for 1-11 months past', () => {
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setDate(twoMonthsAgo.getDate() - 60);
      const pastReflection = {
        ...baseReflection,
        createdAt: twoMonthsAgo.toISOString(),
      };
      render(<ReflectionCard reflection={pastReflection} />);
      expect(screen.getByText('2 months ago')).toBeInTheDocument();
    });

    it('shows years ago for 1+ years past', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      const pastReflection = {
        ...baseReflection,
        createdAt: twoYearsAgo.toISOString(),
      };
      render(<ReflectionCard reflection={pastReflection} />);
      expect(screen.getByText('2 years ago')).toBeInTheDocument();
    });
  });

  describe('hover state', () => {
    it('shows read full reflection text', () => {
      render(<ReflectionCard reflection={baseReflection} />);
      expect(screen.getByText('Read full reflection')).toBeInTheDocument();
    });
  });
});
