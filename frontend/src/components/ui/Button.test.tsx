import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '../../test/renderWithProviders';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
  it('renders its label and responds to clicks', async () => {
    const onClick = vi.fn();
    renderWithProviders(<Button onClick={onClick}>Save station</Button>);

    const button = screen.getByRole('button', { name: 'Save station' });
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disables itself while loading and flags the busy state', () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button isLoading onClick={onClick}>
        Signing in…
      </Button>,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('does not fire when disabled', async () => {
    const onClick = vi.fn();
    renderWithProviders(
      <Button disabled onClick={onClick}>
        Cancel
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" so it never submits a form accidentally', () => {
    renderWithProviders(<Button>Plain</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('honours an explicit submit type for forms', () => {
    renderWithProviders(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('keeps an accessible name when only icons are supplied', () => {
    renderWithProviders(
      <Button aria-label="Open filters" size="icon" leftIcon={<span>icon</span>} />,
    );
    expect(screen.getByRole('button', { name: 'Open filters' })).toBeInTheDocument();
  });
});
