import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';

// Feed screen stub. The product list lands in F2 (useProducts hook + feed UI).
export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Products feed (coming in F2)</Text>
      <Link href="/settings" asChild>
        <Button mode="outlined">Settings</Button>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
});
