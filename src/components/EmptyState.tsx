import type { HTMLAttributes, ReactNode } from 'react';

type EmptyStateProps = HTMLAttributes<HTMLDivElement> & {
  title: ReactNode;
  description?: ReactNode;
};

export function EmptyState({ title, description, className = '', ...props }: EmptyStateProps) {
  return (
    <div className={['empty-state', className].filter(Boolean).join(' ')} {...props}>
      <strong className="empty-state__title">{title}</strong>
      {description ? <p className="empty-state__description">{description}</p> : null}
    </div>
  );
}
