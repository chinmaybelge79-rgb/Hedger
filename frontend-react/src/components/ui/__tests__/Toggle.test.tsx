import { render, screen, fireEvent } from '@testing-library/react';
import { Toggle } from '../Toggle';

describe('Toggle', () => {
  it('renders unchecked by default', () => {
    render(<Toggle aria-label="Test toggle" />);
    const toggle = screen.getByRole('switch', { name: /test toggle/i });
    expect(toggle).not.toHaveAttribute('aria-checked', 'true');
    expect(toggle).toHaveClass('bg-hairline');
  });

  it('renders checked when checked prop is true', () => {
    render(<Toggle checked aria-label="Test toggle" />);
    const toggle = screen.getByRole('switch', { name: /test toggle/i });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(toggle).toHaveClass('bg-trend-up');
  });

  it('calls onChange when clicked', () => {
    const handleChange = vi.fn();
    render(<Toggle onChange={handleChange} aria-label="Test toggle" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).toHaveBeenCalledWith(true);
  });

  it('does not call onChange when disabled', () => {
    const handleChange = vi.fn();
    render(<Toggle disabled onChange={handleChange} aria-label="Test toggle" />);
    fireEvent.click(screen.getByRole('switch'));
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('applies size classes', () => {
    const { rerender } = render(<Toggle size="sm" aria-label="Small" />);
    expect(screen.getByRole('switch')).toHaveClass('w-[32px]');
    expect(screen.getByRole('switch')).toHaveClass('h-[18px]');

    rerender(<Toggle size="default" aria-label="Default" />);
    expect(screen.getByRole('switch')).toHaveClass('w-[40px]');
    expect(screen.getByRole('switch')).toHaveClass('h-[22px]');
  });
});