import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

// Settings screen stub, implemented in F7.
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Settings (coming in F7)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
