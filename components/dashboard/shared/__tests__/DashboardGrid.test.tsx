import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import DashboardGrid from '../DashboardGrid';

// Mock CSS modules
vi.mock('../DashboardGrid.module.css', () => ({
  default: {
    dashboardGrid: 'dashboardGrid',
  },
}));

// ============================================================================
// Tests
// ============================================================================

describe('DashboardGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --------------------------------------------------------------------------
  // Rendering Tests
  // --------------------------------------------------------------------------
  describe('rendering', () => {
    it('should render children correctly', () => {
      render(
        <DashboardGrid>
          <div data-testid="child-1">Child 1</div>
          <div data-testid="child-2">Child 2</div>
        </DashboardGrid>
      );

      expect(screen.getByTestId('child-1')).toBeInTheDocument();
      expect(screen.getByTestId('child-2')).toBeInTheDocument();
      expect(screen.getByText('Child 1')).toBeInTheDocument();
      expect(screen.getByText('Child 2')).toBeInTheDocument();
    });

    it('should apply grid class from CSS module', () => {
      const { container } = render(
        <DashboardGrid>
          <div>Content</div>
        </DashboardGrid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('dashboardGrid');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <DashboardGrid className="custom-grid-class">
          <div>Content</div>
        </DashboardGrid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('custom-grid-class');
    });

    it('should combine CSS module class with custom className', () => {
      const { container } = render(
        <DashboardGrid className="my-custom-class">
          <div>Content</div>
        </DashboardGrid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toHaveClass('dashboardGrid');
      expect(gridElement).toHaveClass('my-custom-class');
    });
  });

  // --------------------------------------------------------------------------
  // Empty Children Tests
  // --------------------------------------------------------------------------
  describe('empty children', () => {
    it('should handle empty children gracefully', () => {
      const { container } = render(<DashboardGrid>{null}</DashboardGrid>);

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toBeInTheDocument();
      expect(gridElement).toHaveClass('dashboardGrid');
    });

    it('should handle no children', () => {
      const { container } = render(<DashboardGrid>{undefined}</DashboardGrid>);

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toBeInTheDocument();
    });

    it('should handle empty array of children', () => {
      const { container } = render(<DashboardGrid>{[]}</DashboardGrid>);

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement).toBeInTheDocument();
      expect(gridElement.children).toHaveLength(0);
    });
  });

  // --------------------------------------------------------------------------
  // Multiple Children Tests
  // --------------------------------------------------------------------------
  describe('multiple children', () => {
    it('should render multiple card children', () => {
      render(
        <DashboardGrid>
          <div data-testid="card-1">Card 1</div>
          <div data-testid="card-2">Card 2</div>
          <div data-testid="card-3">Card 3</div>
          <div data-testid="card-4">Card 4</div>
        </DashboardGrid>
      );

      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-2')).toBeInTheDocument();
      expect(screen.getByTestId('card-3')).toBeInTheDocument();
      expect(screen.getByTestId('card-4')).toBeInTheDocument();
    });

    it('should maintain order of children', () => {
      const { container } = render(
        <DashboardGrid>
          <div>First</div>
          <div>Second</div>
          <div>Third</div>
        </DashboardGrid>
      );

      const gridElement = container.firstChild as HTMLElement;
      expect(gridElement.children[0]).toHaveTextContent('First');
      expect(gridElement.children[1]).toHaveTextContent('Second');
      expect(gridElement.children[2]).toHaveTextContent('Third');
    });
  });
});
