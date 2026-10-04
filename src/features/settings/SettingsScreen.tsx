import Constants from 'expo-constants';
import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Divider, List } from 'react-native-paper';

import { getDataSource } from '@/config/env';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useServices } from '@/services/ServicesProvider';

export function SettingsScreen() {
  const { auth } = useServices();
  const user = useCurrentUser();

  const signOut = async () => {
    await auth.signOut();
    router.replace('/sign-in');
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <List.Item
          title="Signed in as"
          description={user ? (user.phoneNumber ?? user.id) : 'Not signed in'}
          left={(props) => <List.Icon {...props} icon="account" />}
        />
      </List.Section>
      <Divider />
      <List.Section>
        <List.Subheader>About</List.Subheader>
        <List.Item
          title="Data source"
          description={getDataSource()}
          left={(props) => <List.Icon {...props} icon="database" />}
        />
        <List.Item
          title="Version"
          description={Constants.expoConfig?.version ?? 'unknown'}
          left={(props) => <List.Icon {...props} icon="information" />}
        />
      </List.Section>
      {user ? (
        <Button mode="outlined" icon="logout" onPress={signOut} style={styles.button}>
          Sign out
        </Button>
      ) : (
        <Button mode="contained" onPress={() => router.push('/sign-in')} style={styles.button}>
          Sign in
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 24 },
  button: { marginHorizontal: 16, marginTop: 16 },
});
