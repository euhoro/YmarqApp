import { FlatList, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Button,
  Divider,
  Icon,
  IconButton,
  List,
  Text,
} from 'react-native-paper';

import { useDeleteSavedSearch, useSavedSearches } from './useSavedSearches';

/** The user's saved searches: we notify them about new listings matching each one. */
export function AlertsScreen() {
  const savedSearches = useSavedSearches();
  const remove = useDeleteSavedSearch();

  if (savedSearches.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator testID="alerts-loading" size="large" />
      </View>
    );
  }
  if (savedSearches.isError) {
    return (
      <View style={styles.centered}>
        <Text variant="titleMedium">Couldn&apos;t load your alerts</Text>
        <Button onPress={() => savedSearches.refetch()}>Try again</Button>
      </View>
    );
  }

  return (
    <FlatList
      data={savedSearches.data ?? []}
      keyExtractor={(search) => search.id}
      ItemSeparatorComponent={Divider}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        savedSearches.data?.length ? (
          <Text variant="bodyMedium" style={styles.hint}>
            We&apos;ll notify you when a new listing matches one of these searches.
          </Text>
        ) : null
      }
      renderItem={({ item }) => (
        // A plain row: a List.Item without onPress is marked disabled, and so would be its button.
        <View style={styles.row}>
          <List.Icon icon="bell-outline" />
          <Text variant="bodyLarge" numberOfLines={1} style={styles.query}>
            {item.query}
          </Text>
          <IconButton
            icon="delete-outline"
            accessibilityLabel={`Delete alert “${item.query}”`}
            disabled={remove.isPending}
            onPress={() => remove.mutate(item.id)}
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Icon source="bell-outline" size={48} />
          <Text variant="titleMedium">No alerts yet</Text>
          <Text variant="bodyMedium" style={styles.center}>
            Search for something, then tap “Notify me about new matches”.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  center: { textAlign: 'center' },
  content: { flexGrow: 1, maxWidth: 720, width: '100%', alignSelf: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingLeft: 24, paddingRight: 8 },
  query: { flex: 1 },
  hint: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
});
