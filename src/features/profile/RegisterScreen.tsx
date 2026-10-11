import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';

import { DISPLAY_NAME_MAX, DISPLAY_NAME_MIN, normalizeDisplayName } from '@/domain/user';

import { useSaveProfile } from './useProfile';

/** First sign-in only: pick the name other users see. The app gate moves on once it's saved. */
export function RegisterScreen() {
  const [name, setName] = useState('');
  const saveProfile = useSaveProfile();
  const normalized = normalizeDisplayName(name);
  const showError = name.trim().length > 0 && !normalized;

  const save = () => {
    if (normalized) saveProfile.mutate(normalized);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall">What&apos;s your name?</Text>
        <Text variant="bodyMedium">Buyers and sellers will see it when you post or chat.</Text>
        <TextInput
          label="Your name"
          accessibilityLabel="Your name"
          mode="outlined"
          value={name}
          onChangeText={setName}
          autoComplete="name"
          textContentType="name"
          autoFocus
          maxLength={DISPLAY_NAME_MAX + 10}
          error={showError}
          onSubmitEditing={save}
        />
        <HelperText type={showError ? 'error' : 'info'} visible>
          {showError
            ? `Use ${DISPLAY_NAME_MIN}–${DISPLAY_NAME_MAX} characters`
            : 'You can use your first name or a nickname.'}
        </HelperText>
        <HelperText type="error" visible={saveProfile.isError}>
          Couldn&apos;t save your name. Try again.
        </HelperText>
        <Button
          mode="contained"
          onPress={save}
          disabled={!normalized || saveProfile.isPending}
          loading={saveProfile.isPending}
        >
          Continue
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12, padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
});
