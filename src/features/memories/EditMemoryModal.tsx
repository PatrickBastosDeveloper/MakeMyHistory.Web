import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { TextArea } from '../../components/TextArea';
import type { MemoryUI, DateType } from '../../types/memory';
import { formatMemoryDate } from '../../lib/date/formatMemoryDate';
import { deriveTitle } from '../../lib/text/deriveTitle';
import {
  EMPTY_DATE_VALUES,
  getDateError,
  validateFullDate,
  validateYearOnly,
  validateAge,
  autoFormatFullDate,
  formatStoredDateToInput,
} from '../../lib/memoryDate';
import type { DateValues } from '../../lib/memoryDate';

type EditMemoryDatePayload = {
  dateType?: DateType;
  eventDate?: string;
  eventYear?: number;
  age?: number;
};

type EditMemoryPayload = {
  title?: string;
  content: string;
  isImportant: boolean;
  clearDateInformation?: boolean;
} & EditMemoryDatePayload;

type EditMemoryModalProps = {
  memory: MemoryUI | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: EditMemoryPayload) => void;
};

const currentYear = new Date().getFullYear();

export { type EditMemoryPayload };

export function EditMemoryModal({ memory, isOpen, isSaving, onClose, onSave }: EditMemoryModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dateType, setDateType] = useState<DateType | null>(null);
  const [dateValues, setDateValues] = useState<DateValues>(EMPTY_DATE_VALUES);

  useEffect(() => {
    if (memory) {
      setTitle(memory.title ?? '');
      setContent(memory.content);
      setDateType(memory.dateType ?? null);
      const next: DateValues = { FullDate: '', YearOnly: '', Age: '' };
      if (memory.dateType === 'FullDate' && memory.eventDate) {
        next.FullDate = formatStoredDateToInput(memory.eventDate);
      } else if (memory.dateType === 'YearOnly' && memory.eventYear) {
        next.YearOnly = String(memory.eventYear);
      } else if (memory.dateType === 'Age' && memory.age) {
        next.Age = String(memory.age);
      }
      setDateValues(next);
    }
  }, [memory]);

  const [noDate, setNoDate] = useState(false);

  useEffect(() => {
    if (memory) {
      setNoDate(!memory.dateType);
    }
  }, [memory]);

  const derivedTitlePlaceholder = useMemo(() => {
    if (!content.trim()) return 'Descreva um momento importante...';
    return deriveTitle(content);
  }, [content]);

  const currentDateValue = dateType ? dateValues[dateType] : '';
  const dateError = getDateError(dateType, dateValues);
  const hasDateError = dateType !== null && dateError !== null;
  const canSave = Boolean(content.trim()) && !isSaving && !hasDateError && (dateType === null || currentDateValue !== '');

  const handleSave = useCallback(() => {
    if (!canSave || !memory) return;
    const payload: EditMemoryPayload = {
      title: title.trim() || deriveTitle(content.trim()),
      content: content.trim(),
      isImportant: memory.isImportant ?? false,
    };
    if (noDate) {
      payload.clearDateInformation = true;
    } else if (dateType && dateType === 'FullDate' && dateValues.FullDate) {
      const parts = dateValues.FullDate.split('/');
      if (parts.length === 3) {
        const [day, month, yearStr] = parts;
        payload.dateType = 'FullDate';
        payload.eventDate = `${yearStr}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        payload.eventYear = parseInt(yearStr, 10);
      }
    } else if (dateType === 'YearOnly' && dateValues.YearOnly) {
      payload.dateType = 'YearOnly';
      payload.eventYear = parseInt(dateValues.YearOnly, 10);
    } else if (dateType === 'Age' && dateValues.Age) {
      const age = parseInt(dateValues.Age, 10);
      payload.dateType = 'Age';
      payload.age = age;
      payload.eventYear = currentYear - age;
    }
    onSave(payload);
  }, [title, content, dateType, dateValues, memory, canSave, onSave, noDate]);

  if (!isOpen || !memory) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editar memória">
        <div className="modal__header">
          <h2 className="modal__title">Editar memória</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        <div className="modal__body">
          <div className="modal__info">
            <span className="modal__info-label">Criada em</span>
            <span className="modal__info-value">{formatMemoryDate(memory.createdAt)}</span>
          </div>
          <label className="input-field">
            <span className="input-field__label">Título <span className="input-field__optional">(opcional)</span></span>
            <input className="input" type="text" value={title} placeholder={derivedTitlePlaceholder} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <TextArea id="edit-memory-content" label="Conteúdo" placeholder="Escreva um momento importante..." value={content} onChange={(e) => setContent(e.target.value)} rows={4} maxLength={500} />
          <div className="date-type-selector">
            <label className="date-type-checkbox">
              <input type="checkbox" checked={noDate} onChange={(e) => { setNoDate(e.target.checked); if (e.target.checked) { setDateType(null); setDateValues(EMPTY_DATE_VALUES); }}} />
              <span>Sem data</span>
            </label>
            {!noDate && (
              <>
                <span className="date-type-selector__label">Quando isso aconteceu?</span>
                <div className="date-type-options">
                  {(['FullDate', 'YearOnly', 'Age'] as DateType[]).map((type) => (
                    <label key={type} className={`date-type-option${dateType === type ? ' date-type-option--selected' : ''}`}>
                      <input type="radio" name="editDateType" value={type} checked={dateType === type} onChange={() => { setDateType(type); }} />
                      {type === 'FullDate' ? '📅 Data completa' : type === 'YearOnly' ? '🗓️ Apenas ano' : '🎂 Idade na época'}
                    </label>
                  ))}
                </div>
                {dateType === 'FullDate' && (
                  <div className="date-value-input">
                    <input className={['input', validateFullDate(currentDateValue) ? 'input--invalid' : ''].filter(Boolean).join(' ')} type="text" value={currentDateValue}
                      onChange={(e) => {
                        const formatted = autoFormatFullDate(e.target.value, currentDateValue.length);
                        setDateValues((prev) => ({ ...prev, FullDate: formatted }));
                      }}
                      placeholder="dd/mm/aaaa" maxLength={10} />
                    {validateFullDate(currentDateValue) ? <span className="date-value-error">{validateFullDate(currentDateValue)}</span> : null}
                  </div>
                )}
                {dateType === 'YearOnly' && (
                  <div className="date-value-input">
                    <input className={['input', validateYearOnly(currentDateValue) ? 'input--invalid' : ''].filter(Boolean).join(' ')} type="text" inputMode="numeric" value={currentDateValue}
                      onChange={(e) => setDateValues((prev) => ({ ...prev, YearOnly: e.target.value.replace(/[^\d]/g, '') }))}
                      placeholder="Ex: 2018" maxLength={4} />
                    {validateYearOnly(currentDateValue) ? <span className="date-value-error">{validateYearOnly(currentDateValue)}</span> : null}
                  </div>
                )}
                {dateType === 'Age' && (
                  <div className="date-value-input">
                    <input className={['input', validateAge(currentDateValue) ? 'input--invalid' : ''].filter(Boolean).join(' ')} type="text" inputMode="numeric" value={currentDateValue}
                      onChange={(e) => setDateValues((prev) => ({ ...prev, Age: e.target.value.replace(/[^\d]/g, '') }))}
                      placeholder="Ex: 25" maxLength={3} />
                    {validateAge(currentDateValue) ? <span className="date-value-error">{validateAge(currentDateValue)}</span> : null}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        <div className="modal__footer">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button type="button" disabled={!canSave} onClick={handleSave}>{isSaving ? 'Salvando...' : 'Salvar alterações'}</Button>
        </div>
      </div>
    </div>
  );
}
