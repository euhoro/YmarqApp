import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

// Shows the photo just taken. Becomes the create-listing form in F9.
export default function NewListingScreen() {
  const { photoUri } = useLocalSearchParams<{ photoUri?: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'New listing' }} />
      {photoUri ? (
        <Image
          testID="new-listing-photo"
          source={{ uri: photoUri }}
          style={styles.photo}
          contentFit="contain"
          accessibilityLabel="Photo for the new listing"
        />
      ) : (
        <Text variant="titleMedium">No photo</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  photo: { width: '100%', height: '100%' },
});
