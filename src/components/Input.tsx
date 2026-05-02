import type { InputHTMLAttributes, ReactNode } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: ReactNode;
};

export function Input({ label, className = '', id, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="input-field" htmlFor={inputId}>
      {label ? <span className="input-field__label">{label}</span> : null}
      <input id={inputId} className={['input', className].filter(Boolean).join(' ')} {...props} />
    </label>
  );
}
