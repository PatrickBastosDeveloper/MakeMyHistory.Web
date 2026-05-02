import type { AppError } from '../types/app';

const baseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? '';

export type RequestOptions = RequestInit & {
  authToken?: string;
  userId?: string;
};

export async function httpClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.authToken) {
    headers.set('Authorization', `Bearer ${options.authToken}`);
  }

  if (options.userId) {
    headers.set('X-User-Id', options.userId);
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error: AppError = {
      message: await readErrorMessage(response),
      code: String(response.status),
    };

    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function readErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    const payload: unknown = await response.json();

    if (isAppErrorPayload(payload)) {
      return payload.message;
    }
  }

  return 'Ocorreu um erro inesperado.';
}

function isAppErrorPayload(payload: unknown): payload is AppError {
  return (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof (payload as AppError).message === 'string'
  );
}
