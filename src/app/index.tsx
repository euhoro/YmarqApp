import { router, Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';

import { TakePhotoFab } from '@/features/camera/TakePhotoFab';
import { ProductList } from '@/features/feed/components/ProductList';
import { useProducts } from '@/features/feed/useProducts';

export default function FeedScreen() {
  const { data, isLoading, error, refetch, isRefetching } = useProducts();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <View style={styles.headerActions}>
              <IconButton icon="refresh" accessibilityLabel="Refresh" onPress={() => refetch()} />
              <IconButton
                icon="cog"
                accessibilityLabel="Settings"
                onPress={() => router.push('/settings')}
              />
            </View>
          ),
        }}
      />
      <ProductList
        products={data ?? []}
        isLoading={isLoading}
        error={error}
        onRetry={() => refetch()}
        refreshing={isRefetching}
        onRefresh={() => refetch()}
        contentContainerStyle={styles.listContent}
      />
      <TakePhotoFab />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerActions: { flexDirection: 'row' },
  // Keeps the last card clear of the floating camera button.
  listContent: { paddingBottom: 88 },
});
