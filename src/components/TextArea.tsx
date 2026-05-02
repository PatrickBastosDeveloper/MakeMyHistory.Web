import type { TextareaHTMLAttributes, ReactNode } from 'react';

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: ReactNode;
};

export function TextArea({ label, className = '', id, ...props }: TextAreaProps) {
  const textAreaId = id ?? props.name;

  return (
    <label className="input-field" htmlFor={textAreaId}>
      {label ? <span className="input-field__label">{label}</span> : null}
      <textarea
        id={textAreaId}
        className={['input', 'input--textarea', className].filter(Boolean).join(' ')}
        {...props}
      />
    </label>
  );
}
