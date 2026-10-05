import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import { Card, Icon, useTheme } from 'react-native-paper';

import { formatPrice, type Product } from '@/domain/product';

export function ProductCard({ product }: { product: Product }) {
  const theme = useTheme();

  return (
    <Card testID={`product-card-${product.id}`}>
      {/* Clip the image to the card's rounded corners without breaking the Card's shadow. */}
      <View style={[styles.clip, { borderRadius: theme.roundness * 3 }]}>
        {product.imageUrl ? (
          <Image
            testID={`product-image-${product.id}`}
            source={{ uri: product.imageUrl }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel={product.description}
          />
        ) : (
          <View
            testID={`product-image-placeholder-${product.id}`}
            style={[
              styles.image,
              styles.placeholder,
              { backgroundColor: theme.colors.surfaceVariant },
            ]}
          >
            <Icon source="image-off-outline" size={40} color={theme.colors.onSurfaceVariant} />
          </View>
        )}
        <Card.Title
          title={product.description}
          subtitle={[formatPrice(product), product.location, product.hashtag]
            .filter(Boolean)
            .join(' · ')}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  clip: { overflow: 'hidden' },
  image: { width: '100%', aspectRatio: 16 / 9 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
});
