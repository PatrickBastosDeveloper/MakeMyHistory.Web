const MAX_PREVIEW_LENGTH = 55;
const ELLIPSIS = '...';

/**
 * Deriva um título de exibição a partir do início da descrição.
 * Usado apenas visualmente na timeline quando a memória não possui título próprio.
 * Não é salvo no banco.
 */
export function deriveTitle(content: string): string {
  const trimmed = content.trim();
  if (!trimmed) return 'Memória';

  // Pega o primeiro parágrafo/linha
  const firstLine = trimmed.split(/\n/)[0] ?? trimmed;
  const cleaned = firstLine.replace(/[^\wÀ-ÿ\s]/g, '').trim();

  if (cleaned.length <= MAX_PREVIEW_LENGTH) {
    return cleaned;
  }

  // Trunca no último espaço antes do limite
  const truncated = cleaned.slice(0, MAX_PREVIEW_LENGTH);
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > 0) {
    return truncated.slice(0, lastSpace) + ELLIPSIS;
  }

  return truncated + ELLIPSIS;
}
