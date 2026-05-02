import type { HTMLAttributes, ReactNode } from 'react';

type LoadingStateProps = HTMLAttributes<HTMLDivElement> & {
  label?: ReactNode;
};

export function LoadingState({ label = 'Carregando...', className = '', ...props }: LoadingStateProps) {
  return (
    <div className={['loading-state', className].filter(Boolean).join(' ')} {...props}>
      {label}
    </div>
  );
}
