export type User = {
  id: string;
  name?: string;
};

export type UserProfile = {
  userId: string;
  name: string;
  birthDate?: string; // ISO date string
};
