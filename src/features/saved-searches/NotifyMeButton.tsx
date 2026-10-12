import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Button, Portal, Snackbar } from 'react-native-paper';

import { findSavedSearch } from '@/services/saved-searches';

import { useSaveSearch, useSavedSearches } from './useSavedSearches';

/**
 * Under a non-empty search (renders nothing for an empty one): saves it as an alert ("Notify me about new matches"), or shows that it
 * already is one (pressing it then opens the alerts list).
 */
export function NotifyMeButton({ query, style }: { query: string; style?: StyleProp<ViewStyle> }) {
  const savedSearches = useSavedSearches();
  const save = useSaveSearch();
  const [message, setMessage] = useState<{ text: string; saved: boolean } | null>(null);

  const trimmed = query.trim();
  const saved = trimmed ? findSavedSearch(savedSearches.data ?? [], trimmed) : undefined;

  const onSave = () =>
    save.mutate(trimmed, {
      onSuccess: (search) =>
        setMessage({
          text: `Alert saved. We'll tell you about new “${search.query}” listings.`,
          saved: true,
        }),
      onError: (error) =>
        setMessage({ text: error.message || "Couldn't save the alert. Try again.", saved: false }),
    });

  return (
    <>
      {!trimmed ? null : saved ? (
        <Button
          mode="contained-tonal"
          icon="bell-check"
          compact
          onPress={() => router.push('/alerts')}
          accessibilityLabel={`Alert on for “${saved.query}”. Manage alerts`}
          style={[styles.button, style]}
        >
          Alert on for new matches
        </Button>
      ) : (
        <Button
          mode="outlined"
          icon="bell-plus-outline"
          compact
          onPress={onSave}
          loading={save.isPending}
          disabled={save.isPending || savedSearches.isLoading}
          style={[styles.button, style]}
        >
          Notify me about new matches
        </Button>
      )}
      <Portal>
        <Snackbar
          visible={message !== null}
          onDismiss={() => setMessage(null)}
          action={
            message?.saved
              ? { label: 'View alerts', onPress: () => router.push('/alerts') }
              : undefined
          }
        >
          {message?.text}
        </Snackbar>
      </Portal>
    </>
  );
}

const styles = StyleSheet.create({
  button: { alignSelf: 'flex-start' },
});
