import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { Button, HelperText, SegmentedButtons, Text, TextInput } from 'react-native-paper';

import { AuthError, type PhoneVerification } from '@/services/auth';
import { useServices } from '@/services/ServicesProvider';

import { COUNTRY_CODES, toE164 } from './phone';

const CODE_LENGTH = 6;

/**
 * The service's own explanation when it has one (e.g. "SMS isn't enabled for this country").
 * Otherwise the default text, plus the provider's error code when there is one, so a screenshot
 * tells us what went wrong.
 */
const messageFor = (cause: unknown, fallback: string) => {
  if (cause instanceof AuthError) return cause.message;
  const code = (cause as { code?: unknown } | null)?.code;
  return typeof code === 'string' && code ? `${fallback} (${code})` : fallback;
};

/**
 * Phone sign-in in two steps: number → SMS code. Registration and login are the same flow.
 * On success the auth state changes and RootNavigator moves the user into the app.
 */
export function SignInScreen() {
  const { auth } = useServices();
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0].code);
  const [phone, setPhone] = useState('');
  const [verification, setVerification] = useState<PhoneVerification | null>(null);
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const e164 = toE164(countryCode, phone);
  const showPhoneError = phone.replace(/\D/g, '').length >= 7 && !e164;

  const sendCode = async () => {
    if (!e164) return;
    setBusy(true);
    setError(null);
    try {
      setVerification(await auth.startPhoneSignIn(e164));
      setSentTo(e164);
      setCode('');
    } catch (cause) {
      setError(messageFor(cause, "Couldn't send the code. Check the number and try again."));
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!verification) return;
    setBusy(true);
    setError(null);
    try {
      await verification.confirm(code);
    } catch (cause) {
      setError(messageFor(cause, 'Wrong code. Check the SMS and try again.'));
      setBusy(false);
    }
  };

  const changeNumber = () => {
    setVerification(null);
    setCode('');
    setError(null);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text variant="headlineSmall">Welcome to Ymarq</Text>
        {!verification ? (
          <>
            <Text variant="bodyMedium">Enter your phone number. We&apos;ll text you a code.</Text>
            <SegmentedButtons
              value={countryCode}
              onValueChange={setCountryCode}
              buttons={COUNTRY_CODES.map(({ code: value, label }) => ({ value, label }))}
            />
            <TextInput
              label="Phone number"
              accessibilityLabel="Phone number"
              mode="outlined"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              left={<TextInput.Affix text={countryCode} />}
              error={showPhoneError}
              onSubmitEditing={sendCode}
            />
            <HelperText type="error" visible={showPhoneError}>
              Enter a valid mobile number
            </HelperText>
            <Button mode="contained" onPress={sendCode} disabled={!e164 || busy} loading={busy}>
              Send code
            </Button>
          </>
        ) : (
          <>
            <Text variant="bodyMedium">
              Enter the {CODE_LENGTH}-digit code we sent to {sentTo}.
            </Text>
            <TextInput
              label="Code"
              accessibilityLabel="Code"
              mode="outlined"
              value={code}
              onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, CODE_LENGTH))}
              keyboardType="number-pad"
              autoComplete="sms-otp"
              textContentType="oneTimeCode"
              maxLength={CODE_LENGTH}
              onSubmitEditing={verify}
            />
            <Button
              mode="contained"
              onPress={verify}
              disabled={code.length !== CODE_LENGTH || busy}
              loading={busy}
            >
              Verify
            </Button>
            <Button mode="text" onPress={changeNumber} disabled={busy}>
              Change number
            </Button>
          </>
        )}
        <HelperText type="error" visible={error !== null}>
          {error}
        </HelperText>
        {auth.demoHint ? (
          <HelperText type="info" visible>
            {auth.demoHint}
          </HelperText>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 12, padding: 24, maxWidth: 480, width: '100%', alignSelf: 'center' },
});
