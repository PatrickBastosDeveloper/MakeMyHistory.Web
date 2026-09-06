export type FeedbackType = 'Problema' | 'Sugestão' | 'Dúvida' | 'Outro';

export type FeedbackPayload = {
  type: FeedbackType;
  message: string;
  appVersion?: string | null;
  userAgent?: string | null;
  screenWidth?: number | null;
  screenHeight?: number | null;
};

export type FeedbackResponse = {
  feedbackId: string;
  status: string;
};
