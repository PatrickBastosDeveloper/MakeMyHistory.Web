import { formatMemoryDate } from '../../lib/date/formatMemoryDate';
import { track } from '../../lib/track/track';
import { useToast } from '../../lib/toast/useToast';

export function HomePage() {
  const { showToast } = useToast();

  return (
    <section className="hero-card">
      <p className="eyebrow">Home</p>
      <h1>Bem-vindo ao MakeMyHistory</h1>
      <p className="lead">
        Sua base para registrar memórias, ver a timeline e construir sua história pessoal.
      </p>
      <div className="hero-actions">
        <button
          className="pill"
          type="button"
          onClick={() => {
            track('app_opened');
            showToast({
              message: `Hoje é ${formatMemoryDate(new Date())}.`,
              variant: 'info',
            });
          }}
        >
          Abrir saudação
        </button>
      </div>
    </section>
  );
}
