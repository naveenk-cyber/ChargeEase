import type React from 'react';

interface SectionHeadingProps {
  /** Short uppercase context line above the title. */
  eyebrow?: string;
  title: string;
  description?: string;
  /** Trailing link or control, aligned with the title baseline on wide screens. */
  action?: React.ReactNode;
  /** Renders light-on-dark for sections placed on the deep navy band. */
  onDeep?: boolean;
  as?: 'h2' | 'h3';
  className?: string;
  id?: string;
}

/**
 * One heading pattern for every section on the site: eyebrow, title,
 * optional description, optional trailing action. Keeping it in a single
 * component is what stops section headers from drifting apart again.
 */
const SectionHeading: React.FC<SectionHeadingProps> = ({
  eyebrow,
  title,
  description,
  action,
  onDeep = false,
  as: Tag = 'h2',
  className = '',
  id,
}) => (
  <div className={`flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between ${className}`}>
    <div className="max-w-2xl">
      {eyebrow && (
        <p className={`ev-label mb-2 ${onDeep ? 'text-brand-on-deep' : ''}`}>{eyebrow}</p>
      )}
      <Tag id={id} className={`ev-title ${onDeep ? 'text-deep-ink' : 'text-ink'}`}>
        {title}
      </Tag>
      {description && (
        <p
          className={`mt-2 max-w-xl text-[0.9rem] leading-relaxed ${
            onDeep ? 'text-deep-ink-muted' : 'text-ink-muted'
          }`}
        >
          {description}
        </p>
      )}
    </div>
    {action && <div className="shrink-0 self-start sm:self-auto">{action}</div>}
  </div>
);

export default SectionHeading;
