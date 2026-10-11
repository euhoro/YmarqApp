import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  HelperText,
  Icon,
  IconButton,
  List,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { formatPrice } from '@/domain/product';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useDisplayName, useProduct } from '@/features/listing-details/useProduct';
import { otherParticipant, type Message } from '@/services/chat';

import { formatChatTime } from './formatChatTime';
import { useConversation, useMessages, useSendMessage } from './useChat';

/** One conversation: the listing, the messages (polled), and a box to write a new one. */
export function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useCurrentUser();
  const conversation = useConversation(id);
  const messages = useMessages(conversation.data ? id : undefined);
  const product = useProduct(conversation.data?.productId);
  const otherName = useDisplayName(
    conversation.data && user ? otherParticipant(conversation.data, user.id) : null,
  );
  const send = useSendMessage(id);
  const [text, setText] = useState('');
  const list = useRef<FlatList<Message>>(null);

  if (conversation.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator testID="conversation-loading" size="large" />
      </View>
    );
  }
  if (conversation.isError || !conversation.data) {
    return (
      <View style={styles.centered}>
        <Icon source="message-off-outline" size={48} />
        <Text variant="titleMedium">
          {conversation.isError ? "Couldn't load this conversation" : 'Conversation not found'}
        </Text>
      </View>
    );
  }

  const canSend = text.trim().length > 0 && !send.isPending;
  const onSend = () => {
    if (!canSend) return;
    send.mutate(text.trim(), { onSuccess: () => setText('') });
  };
  const listing = product.data;
  const price = listing ? formatPrice(listing) : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Stack.Screen options={{ title: otherName.data ?? 'Chat' }} />
      {listing ? (
        <List.Item
          testID="conversation-listing"
          accessibilityRole="button"
          title={listing.description}
          description={price ?? undefined}
          titleNumberOfLines={1}
          left={(props) => <List.Icon {...props} icon="tag-outline" />}
          onPress={() => router.push({ pathname: '/listing/[id]', params: { id: listing.id } })}
        />
      ) : null}
      <FlatList
        ref={list}
        style={styles.list}
        contentContainerStyle={styles.messages}
        data={messages.data ?? []}
        keyExtractor={(message) => message.id}
        renderItem={({ item }) => <Bubble message={item} mine={item.senderId === user?.id} />}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          messages.isLoading ? (
            <ActivityIndicator style={styles.empty} />
          ) : (
            <Text variant="bodyMedium" style={styles.empty}>
              Say hello and ask about the item.
            </Text>
          )
        }
      />
      {send.isError ? (
        <HelperText type="error" visible>
          Couldn&apos;t send. Try again.
        </HelperText>
      ) : null}
      <View style={styles.composer}>
        <TextInput
          mode="outlined"
          style={styles.input}
          placeholder="Write a message"
          accessibilityLabel="Message text"
          value={text}
          onChangeText={setText}
          onSubmitEditing={onSend}
          returnKeyType="send"
          multiline={false}
        />
        <IconButton
          icon="send"
          mode="contained"
          accessibilityLabel="Send"
          disabled={!canSend}
          onPress={onSend}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.bubble,
        mine
          ? [styles.mine, { backgroundColor: theme.colors.primaryContainer }]
          : [styles.theirs, { backgroundColor: theme.colors.surfaceVariant }],
      ]}
    >
      <Text
        variant="bodyLarge"
        style={{ color: mine ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
      >
        {message.text}
      </Text>
      <Text variant="labelSmall" style={styles.bubbleTime}>
        {formatChatTime(message.sentAt)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, maxWidth: 720, width: '100%', alignSelf: 'center' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  list: { flex: 1 },
  messages: { gap: 8, padding: 16 },
  empty: { textAlign: 'center', marginTop: 32 },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  mine: { alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  theirs: { alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  bubbleTime: { alignSelf: 'flex-end', opacity: 0.7, marginTop: 2 },
  composer: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 8 },
  input: { flex: 1 },
});
