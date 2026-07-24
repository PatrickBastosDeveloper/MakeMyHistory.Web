import { httpClient } from './httpClient';

type ProfileResponse = {
  name?: string | null;
  birthDate?: string | null;
};

export async function getProfile(userId: string): Promise<ProfileResponse | null> {
  try {
    const raw = await httpClient<ProfileResponse>('/api/profile', { userId });
    if (!raw.name) return null;
    return raw;
  } catch (err: unknown) {
    const appErr = err as { code?: string };
    if (appErr.code === '404') return null;
    throw err;
  }
}

type SaveProfilePayload = {
  userId: string;
  name: string;
  birthDate: string;
};

export function saveProfile(userId: string, data: { name: string; birthDate: string }) {
  const payload: SaveProfilePayload = { userId, ...data };
  return httpClient<ProfileResponse>('/api/profile', {
    method: 'PUT',
    userId,
    body: JSON.stringify(payload),
  });
}
