import { Stack } from 'expo-router';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

/** Where people send privacy questions and deletion requests. Replace with a support email before launch. */
export const PRIVACY_CONTACT = 'https://github.com/euhoro/YmarqApp/issues';
export const PRIVACY_UPDATED = '2026-10-21';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'What we collect',
    body:
      '• Your phone number, to sign you in with an SMS code.\n' +
      '• The name you choose, shown to people you chat with.\n' +
      '• Your listings: title, description, price, category, location text and photos you take or pick.\n' +
      '• Chat messages you send to other people about a listing.\n' +
      '• Your saved searches, so we can tell you about matching listings.\n' +
      '• A push token for your phone, if you allow notifications.',
  },
  {
    title: 'How we use it',
    body:
      'Only to run Ymarq: sign you in, show your listings, deliver messages and send the notifications you asked for. ' +
      'We do not sell your data, show ads, or share it with advertisers.',
  },
  {
    title: 'Who can see it',
    body:
      'Listings and their photos are public. Your name is shown to people you chat with. ' +
      'Your phone number and chat messages are not shown to other users.',
  },
  {
    title: 'Services we use',
    body:
      '• Firebase Authentication (Google): phone sign-in and SMS codes.\n' +
      '• Vercel: hosts the website and the server, and stores listing photos.\n' +
      '• Neon: the database for listings, messages and profiles.\n' +
      '• Expo: delivers push notifications to your phone.\n' +
      'Each processes data only to provide its service to us.',
  },
  {
    title: 'Camera and photos',
    body:
      'Ymarq asks for the camera or your photo library only when you add photos to a listing. ' +
      'Only the photos you choose are uploaded.',
  },
  {
    title: 'Keeping and deleting your data',
    body:
      'We keep your data while your account exists. You can delete a listing at any time. ' +
      'To delete your account and everything linked to it, contact us (below) and we will do it within 30 days.',
  },
  {
    title: 'Contact',
    body: `Questions or deletion requests: ${PRIVACY_CONTACT}`,
  },
];

/** The public privacy policy (required by the App Store and Google Play). Open to everyone, signed in or not. */
export function PrivacyScreen() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: true, title: 'Privacy policy' }} />
      <Text variant="headlineSmall">Ymarq privacy policy</Text>
      <Text variant="bodySmall">Last updated {PRIVACY_UPDATED}</Text>
      {SECTIONS.map(({ title, body }) => (
        <View key={title} style={styles.section}>
          <Text variant="titleMedium" accessibilityRole="header">
            {title}
          </Text>
          <Text variant="bodyMedium">{body}</Text>
        </View>
      ))}
      <Text
        variant="bodyMedium"
        style={styles.link}
        accessibilityRole="link"
        onPress={() => Linking.openURL(PRIVACY_CONTACT)}
      >
        Contact us
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  section: { gap: 4 },
  link: { textDecorationLine: 'underline' },
});
