import type { HTMLAttributes, ReactNode } from 'react';

type HeaderProps = HTMLAttributes<HTMLElement> & {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
};

export function Header({ title, subtitle, action, className = '', ...props }: HeaderProps) {
  return (
    <header className={['header', className].filter(Boolean).join(' ')} {...props}>
      <div className="header__content">
        <strong className="header__title">{title}</strong>
        {subtitle ? <p className="header__subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div className="header__action">{action}</div> : null}
    </header>
  );
}
