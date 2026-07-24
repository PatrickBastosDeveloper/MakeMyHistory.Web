import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getProfile, saveProfile } from '../services/userService';
import { queryKeys } from '../lib/queryKeys';

export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.user.profile(userId),
    queryFn: () => getProfile(userId),
    enabled: Boolean(userId),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useSaveUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, name, birthDate }: { userId: string; name: string; birthDate: string }) =>
      saveProfile(userId, { name, birthDate }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.user.profile(variables.userId),
      });
    },
  });
}
