import { useState } from 'react';
import { Button } from '../../components/Button';
import { Header } from '../../components/Header';
import { TextArea } from '../../components/TextArea';
import { deriveTitle } from '../../lib/text/deriveTitle';
import {
  EMPTY_DATE_VALUES,
  getDateError,
  validateFullDate,
  validateYearOnly,
  validateAge,
  autoFormatFullDate,
} from '../../lib/memoryDate';
import type { DateValues } from '../../lib/memoryDate';
import type { DateType } from '../../types/memory';

const MAX_TITLE_LENGTH = 120;

type CreateMemoryFormProps = {
  userId: string;
  isPending: boolean;
  onSave: (payload: {
    userId: string;
    title?: string;
    content: string;
    isImportant: boolean;
    dateType?: DateType;
    eventDate?: string;
    eventYear?: number;
    age?: number;
    clientRequestId: string;
  }) => void;
};

export function CreateMemoryForm({ userId, isPending, onSave }: CreateMemoryFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [dateType, setDateType] = useState<DateType | null>(null);
  const [dateValues, setDateValues] = useState<DateValues>(EMPTY_DATE_VALUES);
  const [noDate, setNoDate] = useState(false);

  const currentYear = new Date().getFullYear();

  const dateError = getDateError(dateType, dateValues);
  const hasDateError = dateType !== null && dateError !== null;
  const currentDateValue = dateType ? dateValues[dateType] : '';
  const canSubmit = Boolean(content.trim()) && !isPending && !hasDateError && (dateType === null || currentDateValue !== '');

  const handleSubmit = () => {
    if (!canSubmit) return;
    const payload: {
      userId: string;
      title?: string;
      content: string;
      isImportant: boolean;
      dateType?: DateType;
      eventDate?: string;
      eventYear?: number;
      age?: number;
      clientRequestId: string;
    } = {
      userId,
      title: title.trim() || deriveTitle(content.trim()) || undefined,
      content: content.trim(),
      isImportant: false,
      clientRequestId: crypto.randomUUID(),
    };
    if (!noDate && dateType === 'FullDate' && dateValues.FullDate) {
      const parts = dateValues.FullDate.split('/');
      if (parts.length === 3) {
        const [day, month, yearStr] = parts;
        const year = parseInt(yearStr, 10);
        payload.dateType = 'FullDate';
        payload.eventDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        payload.eventYear = year;
      }
    } else if (!noDate && dateType === 'YearOnly' && dateValues.YearOnly) {
      payload.dateType = 'YearOnly';
      payload.eventYear = parseInt(dateValues.YearOnly, 10);
    } else if (!noDate && dateType === 'Age' && dateValues.Age) {
      const age = parseInt(dateValues.Age, 10);
      payload.dateType = 'Age';
      payload.age = age;
      payload.eventYear = currentYear - age;
    }
    onSave(payload);
  };

  return (
    <section className="panel-card">
      <Header title="Nova memória" subtitle="Fluxo principal" />
      <div className="memory-form">
        <label className="input-field" htmlFor="memory-title">
          <span className="input-field__label">Título opcional</span>
          <input
            id="memory-title"
            className="input"
            type="text"
            value={title}
            placeholder="Ex.: Viagem para o litoral"
            maxLength={MAX_TITLE_LENGTH}
            onChange={(event) => setTitle(event.target.value)}
          />
        </label>
        <div className="input-footer">
          <span className="timeline-count">{title.length} / {MAX_TITLE_LENGTH}</span>
        </div>
        <TextArea
          id="memory-content"
          label="Conteúdo"
          placeholder="Escreva um momento importante..."
          value={content}
          autoFocus
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          maxLength={500}
        />
        <div className="input-footer">
          <span className="timeline-count">{content.length} / 500</span>
        </div>

        <div className="date-type-selector">
          <label className="date-type-checkbox">
            <input
              type="checkbox"
              checked={noDate}
              onChange={(e) => {
                const checked = e.target.checked;
                setNoDate(checked);
                if (checked) {
                  setDateType(null);
                  setDateValues(EMPTY_DATE_VALUES);
                }
              }}
            />
            <span>Sem data</span>
          </label>

          {!noDate && (
            <>
              <span className="date-type-selector__label">+ Quando isso aconteceu?</span>
              <div className="date-type-options">
                {(['FullDate', 'YearOnly', 'Age'] as DateType[]).map((type) => (
                  <label
                    key={type}
                    className={`date-type-option${dateType === type ? ' date-type-option--selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="dateType"
                      value={type}
                      checked={dateType === type}
                      onChange={() => { setDateType(type); setDateValues(EMPTY_DATE_VALUES); }}
                    />
                    {type === 'FullDate' ? 'Data completa' : type === 'YearOnly' ? 'Apenas ano' : 'Idade na época'}
                  </label>
                ))}
              </div>

              {dateType === 'FullDate' && (
                <div className="date-value-input">
                  <input
                    className={['input', validateFullDate(dateValues.FullDate) ? 'input--invalid' : ''].filter(Boolean).join(' ')}
                    type="text"
                    value={dateValues.FullDate}
                    onChange={(e) => {
                      const formatted = autoFormatFullDate(e.target.value, dateValues.FullDate.length);
                      setDateValues((prev) => ({ ...prev, FullDate: formatted }));
                    }}
                    placeholder="dd/mm/aaaa"
                    maxLength={10}
                  />
                  {validateFullDate(dateValues.FullDate) ? <span className="date-value-error">{validateFullDate(dateValues.FullDate)}</span> : null}
                </div>
              )}
              {dateType === 'YearOnly' && (
                <div className="date-value-input">
                  <input
                    className={['input', validateYearOnly(dateValues.YearOnly) ? 'input--invalid' : ''].filter(Boolean).join(' ')}
                    type="text" inputMode="numeric"
                    value={dateValues.YearOnly}
                    onChange={(e) => setDateValues((prev) => ({ ...prev, YearOnly: e.target.value.replace(/[^\d]/g, '') }))}
                    placeholder="Ex: 2018" maxLength={4}
                  />
                  {validateYearOnly(dateValues.YearOnly) ? <span className="date-value-error">{validateYearOnly(dateValues.YearOnly)}</span> : null}
                </div>
              )}
              {dateType === 'Age' && (
                <div className="date-value-input">
                  <input
                    className={['input', validateAge(dateValues.Age) ? 'input--invalid' : ''].filter(Boolean).join(' ')}
                    type="text" inputMode="numeric"
                    value={dateValues.Age}
                    onChange={(e) => setDateValues((prev) => ({ ...prev, Age: e.target.value.replace(/[^\d]/g, '') }))}
                    placeholder="Ex: 25" maxLength={3}
                  />
                  {validateAge(dateValues.Age) ? <span className="date-value-error">{validateAge(dateValues.Age)}</span> : null}
                </div>
              )}
            </>
          )}
        </div>

        <div className="hero-actions">
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={() => {
              if (navigator.onLine === false) return;
              handleSubmit();
            }}
          >
            {isPending ? 'Guardando...' : 'Salvar memória'}
          </Button>
        </div>
      </div>
    </section>
  );
}
