import { FlatList, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { ActivityIndicator, Button, Text } from 'react-native-paper';

import type { Product } from '@/domain/product';

import { ProductCard } from './ProductCard';

export interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  error: Error | null;
  onRetry(): void;
  refreshing: boolean;
  onRefresh(): void;
  /** Extra list padding, e.g. room for a floating button over the last card. */
  contentContainerStyle?: StyleProp<ViewStyle>;
}

export function ProductList({
  products,
  isLoading,
  error,
  onRetry,
  refreshing,
  onRefresh,
  contentContainerStyle,
}: ProductListProps) {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator testID="products-loading" size="large" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text variant="titleMedium">Couldn&apos;t load products</Text>
        <Text variant="bodyMedium">{error.message}</Text>
        <Button mode="contained" onPress={onRetry}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <FlatList
      testID="products-list"
      data={products}
      keyExtractor={(product) => product.id}
      renderItem={({ item }) => <ProductCard product={item} />}
      contentContainerStyle={[styles.content, contentContainerStyle]}
      ListEmptyComponent={
        <View style={styles.centered}>
          <Text variant="titleMedium">No products yet</Text>
        </View>
      }
      // Passing these to FlatList (rather than a custom RefreshControl) gives pull-to-refresh on native.
      refreshing={refreshing}
      onRefresh={onRefresh}
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  content: { flexGrow: 1, gap: 12, padding: 16 },
});
