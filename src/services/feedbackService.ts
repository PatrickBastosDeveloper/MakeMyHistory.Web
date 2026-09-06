import { httpClient } from './httpClient';
import type { FeedbackPayload, FeedbackResponse } from '../types/feedback';

export async function submitFeedback(
  userId: string,
  payload: FeedbackPayload,
): Promise<FeedbackResponse> {
  return httpClient<FeedbackResponse>('/api/feedbacks', {
    method: 'POST',
    userId,
    body: JSON.stringify(payload),
  });
}
