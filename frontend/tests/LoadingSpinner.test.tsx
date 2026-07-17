import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../src/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders with default size', () => {
    render(<LoadingSpinner />);
    const container = screen.getByRole('status');
    expect(container).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('accepts size prop sm', () => {
    render(<LoadingSpinner size="sm" />);
    const spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveStyle({ width: '20px', height: '20px' });
  });

  it('accepts size prop lg', () => {
    render(<LoadingSpinner size="lg" />);
    const spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveStyle({ width: '52px', height: '52px' });
  });

  it('has aria-busy="true" attribute', () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
  });

  it('has aria-label with the label prop', () => {
    render(<LoadingSpinner label="Fetching data..." />);
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Fetching data...');
  });

  it('displays the label text', () => {
    render(<LoadingSpinner label="Processing request..." />);
    expect(screen.getByText('Processing request...')).toBeInTheDocument();
  });

  it('defaults to md size when size not specified', () => {
    render(<LoadingSpinner />);
    const spinnerDiv = screen.getByRole('status').firstChild as HTMLElement;
    expect(spinnerDiv).toHaveStyle({ width: '36px', height: '36px' });
  });
});
