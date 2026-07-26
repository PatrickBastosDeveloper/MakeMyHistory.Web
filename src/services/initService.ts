import { httpClient } from './httpClient';

type InitResponse = {
  userId: string;
  recoveryCode: string;
};

type RecoverResponse = {
  userId: string;
};

export async function initUser(existingUserId?: string): Promise<InitResponse> {
  return httpClient<InitResponse>('/api/users/init', {
    method: 'POST',
    userId: existingUserId,
  });
}

export async function recoverUser(recoveryCode: string): Promise<RecoverResponse> {
  return httpClient<RecoverResponse>('/api/users/recover', {
    method: 'POST',
    body: JSON.stringify({ recoveryCode }),
  });
}
