import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useServices } from '@/services/ServicesProvider';

/** How often open chat screens look for new messages (until the API pushes them, #49/#51). */
export const CHAT_POLL_MS = 5000;

/** The signed-in user's conversations, newest first. */
export function useConversations() {
  const { chat } = useServices();
  const user = useCurrentUser();
  return useQuery({
    queryKey: ['chats', 'list', user?.id],
    queryFn: () => chat.listConversations(),
    enabled: user !== null,
    refetchInterval: CHAT_POLL_MS,
  });
}

/** One conversation (`data` is null when it doesn't exist). */
export function useConversation(id: string | undefined) {
  const { chat } = useServices();
  return useQuery({
    queryKey: ['chats', 'detail', id],
    queryFn: () => chat.getConversation(id!),
    enabled: Boolean(id),
  });
}

/** Messages in a conversation, oldest first, polled while the screen is open. */
export function useMessages(id: string | undefined) {
  const { chat } = useServices();
  return useQuery({
    queryKey: ['chats', 'messages', id],
    queryFn: () => chat.listMessages(id!),
    enabled: Boolean(id),
    refetchInterval: CHAT_POLL_MS,
  });
}

export function useStartConversation() {
  const { chat } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => chat.startConversation(productId),
    onSuccess: (conversation) => {
      queryClient.setQueryData(['chats', 'detail', conversation.id], conversation);
      return queryClient.invalidateQueries({ queryKey: ['chats', 'list'] });
    },
  });
}

export function useSendMessage(conversationId: string) {
  const { chat } = useServices();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => chat.sendMessage(conversationId, text),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['chats'] }),
  });
}
