import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '../../components/Button';
import { TextArea } from '../../components/TextArea';
import type { MemoryUI, DateType } from '../../types/memory';
import { formatMemoryDate } from '../../lib/date/formatMemoryDate';
import { deriveTitle } from '../../lib/text/deriveTitle';
import {
  EMPTY_DATE_VALUES,
  getDateError,
  getTodayDisplayDate,
  validateFullDate,
  validateYearOnly,
  validateAge,
  autoFormatFullDate,
  formatStoredDateToInput,
} from '../../lib/memoryDate';
import { buildDatePayload } from '../../lib/memoryDate/datePayload';
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
  /** Data de nascimento (aaaa-mm-dd) do perfil, usada para validar as datas como UX. */
  birthDate?: string | null;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSave: (payload: EditMemoryPayload) => void;
};

export { type EditMemoryPayload };

export function EditMemoryModal({ memory, birthDate, isOpen, isSaving, onClose, onSave }: EditMemoryModalProps) {
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
  const [today, setToday] = useState(false);

  useEffect(() => {
    if (memory) {
      setNoDate(!memory.dateType);
      // "Hoje" é sempre uma ação do usuário, nunca um estado lido do registro:
      // uma memória gravada ontem com "Hoje" abre como Data completa de ontem.
      setToday(false);
    }
  }, [memory]);

  const todayDisplay = getTodayDisplayDate();
  const todayError = today ? validateFullDate(todayDisplay, birthDate) : null;

  const derivedTitlePlaceholder = useMemo(() => {
    if (!content.trim()) return 'Descreva um momento importante...';
    return deriveTitle(content);
  }, [content]);

  const currentDateValue = dateType ? dateValues[dateType] : '';
  const dateError = getDateError(dateType, dateValues, birthDate);
  const hasDateError = dateType !== null && dateError !== null;
  const canSave = Boolean(content.trim())
    && !isSaving
    && !hasDateError
    && todayError === null
    && (today || dateType === null || currentDateValue !== '');

  const handleSave = useCallback(() => {
    if (!canSave || !memory) return;
    const payload: EditMemoryPayload = {
      title: title.trim() || deriveTitle(content.trim()),
      content: content.trim(),
      isImportant: memory.isImportant ?? false,
      ...buildDatePayload({ today, noDate, dateType, dateValues }),
    };

    // clearDateInformation só vale quando nada foi escolhido: com "Hoje"
    // marcado há uma data nova, e apagar as datas no backend venceria ela.
    if (noDate && !today) {
      payload.clearDateInformation = true;
    }

    onSave(payload);
  }, [title, content, dateType, dateValues, memory, canSave, onSave, noDate, today]);

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
            <div className="date-type-checks">
              <label className="date-type-checkbox" title="A memória fica sem nenhuma data">
                <input type="checkbox" checked={noDate} onChange={(e) => {
                  const checked = e.target.checked;
                  setNoDate(checked);
                  if (checked) { setToday(false); setDateType(null); setDateValues(EMPTY_DATE_VALUES); }
                }} />
                <span>Sem data</span>
              </label>
              <label className="date-type-checkbox" title="Grava a data de hoje para este acontecimento">
                <input type="checkbox" checked={today} onChange={(e) => {
                  const checked = e.target.checked;
                  setToday(checked);
                  if (checked) { setNoDate(false); setDateType(null); setDateValues(EMPTY_DATE_VALUES); }
                }} />
                <span>Hoje</span>
              </label>
            </div>
            {today && (
              <p className="date-type-hint">Será salvo: <strong>{todayDisplay}</strong></p>
            )}
            {todayError ? <span className="date-value-error">{todayError}</span> : null}
            {!noDate && !today && (
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
                    <input className={['input', validateFullDate(currentDateValue, birthDate) ? 'input--invalid' : ''].filter(Boolean).join(' ')} type="text" value={currentDateValue}
                      onChange={(e) => {
                        const formatted = autoFormatFullDate(e.target.value, currentDateValue.length);
                        setDateValues((prev) => ({ ...prev, FullDate: formatted }));
                      }}
                      placeholder="dd/mm/aaaa" maxLength={10} />
                    {validateFullDate(currentDateValue, birthDate) ? <span className="date-value-error">{validateFullDate(currentDateValue, birthDate)}</span> : null}
                  </div>
                )}
                {dateType === 'YearOnly' && (
                  <div className="date-value-input">
                    <input className={['input', validateYearOnly(currentDateValue, birthDate) ? 'input--invalid' : ''].filter(Boolean).join(' ')} type="text" inputMode="numeric" value={currentDateValue}
                      onChange={(e) => setDateValues((prev) => ({ ...prev, YearOnly: e.target.value.replace(/[^\d]/g, '') }))}
                      placeholder="Ex: 2018" maxLength={4} />
                    {validateYearOnly(currentDateValue, birthDate) ? <span className="date-value-error">{validateYearOnly(currentDateValue, birthDate)}</span> : null}
                  </div>
                )}
                {dateType === 'Age' && (
                  <div className="date-value-input">
                    <input className={['input', validateAge(currentDateValue, birthDate) ? 'input--invalid' : ''].filter(Boolean).join(' ')} type="text" inputMode="numeric" value={currentDateValue}
                      onChange={(e) => setDateValues((prev) => ({ ...prev, Age: e.target.value.replace(/[^\d]/g, '') }))}
                      placeholder="Ex: 25" maxLength={3} />
                    {validateAge(currentDateValue, birthDate) ? <span className="date-value-error">{validateAge(currentDateValue, birthDate)}</span> : null}
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
