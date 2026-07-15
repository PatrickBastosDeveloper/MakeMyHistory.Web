import { useCallback, useEffect, useRef, useState } from 'react';

type KebabMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  disabled?: boolean;
};

export function KebabMenu({ onEdit, onDelete, disabled }: KebabMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
      setOpen(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open, handleClickOutside]);

  return (
    <div ref={menuRef} className="kebab-menu">
      <button
        type="button"
        className="kebab-menu__trigger"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        aria-label="Opções da memória"
        aria-expanded={open}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <circle cx="10" cy="4" r="1.5" />
          <circle cx="10" cy="10" r="1.5" />
          <circle cx="10" cy="16" r="1.5" />
        </svg>
      </button>

      {open && (
        <div className="kebab-menu__dropdown" role="menu">
          <button
            type="button"
            className="kebab-menu__item"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
          >
            ✏️ Editar
          </button>
          <button
            type="button"
            className="kebab-menu__item kebab-menu__item--danger"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
          >
            🗑️ Excluir
          </button>
        </div>
      )}
    </div>
  );
}
