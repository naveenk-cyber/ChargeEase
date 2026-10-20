import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from './buttonStyles';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Both spellings exist in the app; accept either. */
  loading?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      isLoading,
      leftIcon,
      rightIcon,
      fullWidth = false,
      children,
      className = '',
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const busy = Boolean(loading || isLoading);

    return (
      <button
        ref={ref}
        type={type}
        className={buttonClasses({ variant, size, fullWidth, className })}
        disabled={disabled || busy}
        aria-busy={busy || undefined}
        {...props}
      >
        {busy ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && (
            <span className="flex-shrink-0" aria-hidden="true">
              {leftIcon}
            </span>
          )
        )}
        {children && <span>{children}</span>}
        {!busy && rightIcon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
