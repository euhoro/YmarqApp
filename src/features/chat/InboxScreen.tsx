import { Image } from 'expo-image';
import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Button, Divider, Icon, List, Text, useTheme } from 'react-native-paper';

import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useDisplayName, useProduct } from '@/features/listing-details/useProduct';
import { otherParticipant, type Conversation } from '@/services/chat';

import { formatChatTime } from './formatChatTime';
import { useConversations } from './useChat';

/** All of the user's conversations, newest first. */
export function InboxScreen() {
  const conversations = useConversations();

  if (conversations.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator testID="inbox-loading" size="large" />
      </View>
    );
  }
  if (conversations.isError) {
    return (
      <View style={styles.centered}>
        <Text variant="titleMedium">Couldn&apos;t load your messages</Text>
        <Button onPress={() => conversations.refetch()}>Try again</Button>
      </View>
    );
  }

  return (
    <FlatList
      data={conversations.data ?? []}
      keyExtractor={(conversation) => conversation.id}
      renderItem={({ item }) => <ConversationRow conversation={item} />}
      ItemSeparatorComponent={Divider}
      contentContainerStyle={styles.content}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Icon source="message-text-outline" size={48} />
          <Text variant="titleMedium">No messages yet</Text>
          <Text variant="bodyMedium">Open a listing and message the seller.</Text>
        </View>
      }
    />
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const theme = useTheme();
  const user = useCurrentUser();
  const product = useProduct(conversation.productId);
  const otherName = useDisplayName(user ? otherParticipant(conversation, user.id) : null);

  const name = otherName.data ?? 'Someone';
  const listing = product.data?.description ?? 'Listing';
  const last = conversation.lastMessage;
  const preview = last
    ? `${last.senderId === user?.id ? 'You: ' : ''}${last.text}`
    : 'No messages yet';

  return (
    <List.Item
      testID={`conversation-${conversation.id}`}
      accessibilityRole="button"
      title={`${name} · ${listing}`}
      description={preview}
      titleNumberOfLines={1}
      descriptionNumberOfLines={1}
      onPress={() => router.push({ pathname: '/chats/[id]', params: { id: conversation.id } })}
      left={() =>
        product.data?.imageUrl ? (
          <Image
            source={{ uri: product.data.imageUrl }}
            style={styles.thumb}
            contentFit="cover"
            accessibilityLabel={listing}
          />
        ) : (
          <View
            style={[styles.thumb, styles.noThumb, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Icon source="image-off-outline" size={24} color={theme.colors.onSurfaceVariant} />
          </View>
        )
      }
      right={() => (
        <Text variant="labelSmall" style={styles.time}>
          {formatChatTime(conversation.updatedAt)}
        </Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  content: { flexGrow: 1, maxWidth: 720, width: '100%', alignSelf: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 8, marginLeft: 16 },
  noThumb: { alignItems: 'center', justifyContent: 'center' },
  time: { alignSelf: 'flex-start', marginTop: 4 },
});
