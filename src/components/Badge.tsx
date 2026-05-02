import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  children: ReactNode;
};

const variantClassNames: Record<BadgeVariant, string> = {
  default: 'badge badge--default',
  success: 'badge badge--success',
  warning: 'badge badge--warning',
  danger: 'badge badge--danger',
};

export function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  const mergedClassName = [variantClassNames[variant], className].filter(Boolean).join(' ');

  return (
    <span className={mergedClassName} {...props}>
      {children}
    </span>
  );
}
