import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle, Mail, Send, Zap } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Wordmark from '../components/ui/Wordmark';
import { authService } from '../services/api';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter the email address for your account.');
      return;
    }

    setIsLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'We could not request a reset link. Try again.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-14 sm:px-6 lg:py-20">
      <Link to="/" className="inline-flex items-center gap-2.5 self-center">
        <span className="grid h-10 w-10 place-items-center rounded-[14px] bg-brand text-on-accent">
          <Zap className="h-5 w-5" fill="currentColor" strokeWidth={0} aria-hidden="true" />
        </span>
        <Wordmark className="text-[1.4rem] text-ink" />
      </Link>

      <div className="mt-8 rounded-card border border-line bg-surface p-6 shadow-card sm:p-8">
        {sent ? (
          <div className="text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-soft">
              <CheckCircle className="h-6 w-6 text-success-ink" aria-hidden="true" />
            </span>
            <h1 className="mt-5 text-2xl font-bold tracking-[-0.03em] text-ink">Check your inbox</h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-muted">
              If an account exists for <span className="font-medium text-ink">{email}</span>, a reset
              link is on its way. The link expires after 30 minutes.
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ink-subtle">
              Demo build: password reset emails are only delivered when the local API has mail
              configured. In development the API response includes the token.
            </p>
            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-strong"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-[1.9rem] font-bold leading-tight tracking-[-0.035em] text-ink">
              Reset your password
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              Enter the email on your account and we will send a reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-control border border-error/30 bg-error-soft px-3.5 py-3 text-sm text-error-ink"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}

              <Input
                label="Email address"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                leftIcon={<Mail />}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<Send className="h-4 w-4" />}
              >
                {isLoading ? 'Sending…' : 'Send reset link'}
              </Button>
            </form>

            <Link
              to="/login"
              className="mt-6 inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-ink"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to sign in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
