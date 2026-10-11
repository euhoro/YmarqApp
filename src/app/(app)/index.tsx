import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, Searchbar } from 'react-native-paper';

import { TakePhotoFab } from '@/features/camera/TakePhotoFab';
import { ProductList } from '@/features/feed/components/ProductList';
import { useProducts } from '@/features/feed/useProducts';
import { useDebouncedValue } from '@/features/search/useDebouncedValue';
import { useSearchProducts } from '@/features/search/useSearchProducts';

export default function FeedScreen() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const searching = debouncedQuery.trim().length > 0;

  const feed = useProducts();
  const search = useSearchProducts(debouncedQuery);
  const active = searching ? search : feed;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton
                icon="refresh"
                accessibilityLabel="Refresh"
                onPress={() => active.refetch()}
              />
              <IconButton
                icon="cog"
                accessibilityLabel="Settings"
                onPress={() => router.push('/settings')}
              />
            </View>
          ),
        }}
      />
      <Searchbar
        placeholder="Search listings"
        accessibilityLabel="Search listings"
        value={query}
        onChangeText={setQuery}
        style={styles.search}
        autoCorrect={false}
      />
      <ProductList
        products={active.data ?? []}
        isLoading={active.isLoading}
        error={active.error}
        onRetry={() => active.refetch()}
        refreshing={active.isRefetching}
        onRefresh={() => active.refetch()}
        emptyText={searching ? `No results for “${debouncedQuery.trim()}”` : undefined}
        contentContainerStyle={styles.listContent}
      />
      <TakePhotoFab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row' },
  search: { marginHorizontal: 16, marginTop: 12 },
  // Keeps the last card clear of the floating camera button.
  listContent: { paddingBottom: 88 },
});
