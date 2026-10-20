import type React from 'react';

interface WordmarkProps {
  /** Size and colour utilities for the whole mark, e.g. `text-lg text-deep-ink`. */
  className?: string;
  /** Use the deep-navy accent instead of the surface one. */
  onDeep?: boolean;
}

/**
 * The ChargeEase wordmark.
 *
 * One treatment everywhere it appears: "Charge" inherits the surrounding ink,
 * "Ease" carries the emerald accent. Previously the header and the auth pages
 * rendered it as gradient text while the footer used two colours, so the same
 * logo looked like three different logos.
 */
const Wordmark: React.FC<WordmarkProps> = ({ className = '', onDeep = false }) => (
  <span className={`font-semibold leading-none tracking-[-0.02em] ${className}`}>
    Charge<span className={onDeep ? 'text-brand-on-deep' : 'text-brand'}>Ease</span>
  </span>
);

export default Wordmark;
