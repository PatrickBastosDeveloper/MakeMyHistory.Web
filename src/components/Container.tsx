import type { HTMLAttributes, ReactNode } from 'react';

type ContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function Container({ className = '', children, ...props }: ContainerProps) {
  return (
    <div className={['container', className].filter(Boolean).join(' ')} {...props}>
      {children}
    </div>
  );
}
