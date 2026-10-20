import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../test/renderWithProviders';
import ResetPasswordPage from './ResetPasswordPage';
import { ApiError, authService } from '../services/api';

/** The page reads `?token=` from the URL, so the route carries the query. */
function renderReset(token?: string) {
  return renderWithProviders(<ResetPasswordPage />, {
    route: token ? `/reset-password?token=${token}` : '/reset-password',
  });
}

const resetPassword = () => vi.spyOn(authService, 'resetPassword');

beforeEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('ResetPasswordPage — application-level validation', () => {
  it('asks for the token instead of falling back to native browser validation', async () => {
    const reset = resetPassword();
    renderReset();

    expect(screen.getByLabelText('Reset token')).toBeRequired();
    await userEvent.type(screen.getByLabelText('New password'), 'Demo1234!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Paste the reset token from your reset link.');
    expect(reset).not.toHaveBeenCalled();
  });

  it('asks for a password when the field is empty', async () => {
    const reset = resetPassword();
    renderReset('tok-123');

    await userEvent.type(screen.getByLabelText('Confirm password'), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a new password.');
    expect(reset).not.toHaveBeenCalled();
  });

  it('reports mismatched passwords before calling the API', async () => {
    const reset = resetPassword();
    renderReset('tok-123');

    await userEvent.type(screen.getByLabelText('New password'), 'Demo1234!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Demo1234?');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match.');
    expect(reset).not.toHaveBeenCalled();
  });

  it('submits a valid token and password and reports success politely', async () => {
    const reset = resetPassword().mockResolvedValue({
      message: 'Password updated. Please sign in again.',
    });
    renderReset('tok-123');

    await userEvent.type(screen.getByLabelText('New password'), 'Demo1234!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

    await waitFor(() => expect(reset).toHaveBeenCalledWith('tok-123', 'Demo1234!'));
    // Success is announced as a status update, not an alert.
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Password updated. Please sign in again.',
    );
  });

  it('surfaces an expired or used token from the API', async () => {
    resetPassword().mockRejectedValue(
      new ApiError('This reset link is invalid or has expired.', 'VALIDATION_ERROR', 400),
    );
    renderReset('tok-used');

    await userEvent.type(screen.getByLabelText('New password'), 'Demo1234!');
    await userEvent.type(screen.getByLabelText('Confirm password'), 'Demo1234!');
    await userEvent.click(screen.getByRole('button', { name: 'Update password' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'This reset link is invalid or has expired.',
    );
  });
});
