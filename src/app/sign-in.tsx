import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

// Phone sign-in screen stub, implemented in F6.
export default function SignInScreen() {
  return (
    <View style={styles.container}>
      <Text variant="titleMedium">Phone sign-in (coming in F6)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
