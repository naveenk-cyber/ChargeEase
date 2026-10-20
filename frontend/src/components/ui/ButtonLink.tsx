import React, { forwardRef } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import {
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from './buttonStyles';

export interface ButtonLinkProps extends Omit<LinkProps, 'className'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

/**
 * A navigation action that looks exactly like `Button`.
 *
 * Use this instead of wrapping a `<Button>` in a `<Link>`: nesting two
 * interactive elements breaks focus order, screen-reader announcements and
 * middle-click / open-in-new-tab behaviour. The class source is shared with
 * `Button`, so the two stay visually identical.
 */
const ButtonLink = forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ variant = 'primary', size = 'md', leftIcon, rightIcon, fullWidth = false, className, children, ...props }, ref) => (
    <Link
      ref={ref}
      className={buttonClasses({ variant, size, fullWidth, className })}
      {...props}
    >
      {leftIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {leftIcon}
        </span>
      )}
      {children}
      {rightIcon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {rightIcon}
        </span>
      )}
    </Link>
  ),
);

ButtonLink.displayName = 'ButtonLink';

export default ButtonLink;
