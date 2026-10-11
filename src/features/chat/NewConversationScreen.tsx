import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Icon, Text } from 'react-native-paper';

import { useStartConversation } from './useChat';

/** `/chats/new?productId=…`: opens (or creates) the chat about a listing, then shows it. */
export function NewConversationScreen() {
  const { productId } = useLocalSearchParams<{ productId?: string }>();
  const start = useStartConversation();
  const { mutate } = start;

  useEffect(() => {
    if (!productId) return;
    // Safe to repeat: the repository returns the existing conversation for this listing.
    mutate(productId, {
      onSuccess: (conversation) =>
        router.replace({ pathname: '/chats/[id]', params: { id: conversation.id } }),
    });
  }, [productId, mutate]);

  if (!productId || start.isError) {
    return (
      <View style={styles.centered}>
        <Icon source="message-off-outline" size={48} />
        <Text variant="titleMedium">Couldn&apos;t start this chat</Text>
        {start.error ? <Text variant="bodyMedium">{start.error.message}</Text> : null}
        <Button onPress={() => router.back()}>Go back</Button>
      </View>
    );
  }

  return (
    <View style={styles.centered}>
      <ActivityIndicator testID="new-conversation-loading" size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
});
