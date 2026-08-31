import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardContent, CardFooter } from '../Card';

describe('Card', () => {
  it('renders card with children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
    expect(screen.getByTestId('card')).toHaveClass('border-hairline');
  });

  it('renders card header', () => {
    render(
      <Card>
        <CardHeader title="Test Title" subtitle="Test Subtitle" />
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  it('renders card content', () => {
    render(
      <Card>
        <CardContent>Content here</CardContent>
      </Card>
    );
    expect(screen.getByText('Content here')).toBeInTheDocument();
  });

  it('renders card footer with action', () => {
    render(
      <Card>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );
    expect(screen.getByRole('button', { name: /action/i })).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    const { rerender } = render(<Card variant="elevated">Elevated</Card>);
    expect(screen.getByTestId('card')).toHaveClass('shadow-cmd');

    rerender(<Card variant="bordered">Bordered</Card>);
    expect(screen.getByTestId('card')).toHaveClass('border-hairline');
  });

  it('applies padding classes', () => {
    const { rerender } = render(<Card padding="none">No padding</Card>);
    expect(screen.getByTestId('card')).not.toHaveClass('p-4');

    rerender(<Card padding="lg">Large padding</Card>);
    expect(screen.getByTestId('card')).toHaveClass('p-6');
  });
});