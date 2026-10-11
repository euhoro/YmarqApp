import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  ActivityIndicator,
  Avatar,
  Button,
  Chip,
  HelperText,
  Icon,
  Text,
  useTheme,
} from 'react-native-paper';

import { formatPrice } from '@/domain/product';
import { useCurrentUser } from '@/features/auth/useCurrentUser';

import { useDisplayName, useProduct } from './useProduct';

/** Everything about one listing, and the way to contact the seller. */
export function ListingDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const user = useCurrentUser();
  const product = useProduct(id);
  const sellerName = useDisplayName(product.data?.publisherId ?? null);

  if (product.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator testID="listing-loading" size="large" />
      </View>
    );
  }
  if (product.isError || !product.data) {
    return (
      <View style={styles.centered}>
        <Stack.Screen options={{ title: 'Listing' }} />
        <Icon source="tag-off-outline" size={48} />
        <Text variant="titleMedium">
          {product.isError ? "Couldn't load this listing" : "This listing isn't available anymore"}
        </Text>
      </View>
    );
  }

  const listing = product.data;
  const price = formatPrice(listing);
  const isOwn = user !== null && listing.publisherId === user.id;
  const seller = sellerName.data ?? 'Seller';

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: listing.category ?? 'Listing' }} />
      {listing.imageUrl ? (
        <Image
          testID="listing-photo"
          source={{ uri: listing.imageUrl }}
          style={styles.photo}
          contentFit="cover"
          accessibilityLabel={listing.description}
        />
      ) : (
        <View
          style={[styles.photo, styles.noPhoto, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          <Icon source="image-off-outline" size={48} color={theme.colors.onSurfaceVariant} />
        </View>
      )}

      <View style={styles.body}>
        {price ? (
          <Text variant="headlineMedium" style={{ color: theme.colors.primary }}>
            {price}
          </Text>
        ) : null}
        <Text variant="titleLarge">{listing.description}</Text>
        <View style={styles.chips}>
          {listing.category ? <Chip icon="shape-outline">{listing.category}</Chip> : null}
          {listing.location ? <Chip icon="map-marker-outline">{listing.location}</Chip> : null}
        </View>
        {listing.hashtag ? <Text variant="bodyMedium">{listing.hashtag}</Text> : null}

        {listing.publisherId ? (
          <View style={styles.seller}>
            <Avatar.Text size={40} label={seller.slice(0, 1).toUpperCase()} />
            <View>
              <Text variant="labelMedium">{isOwn ? 'Your listing' : 'Sold by'}</Text>
              <Text variant="titleMedium">{isOwn ? 'You' : seller}</Text>
            </View>
          </View>
        ) : null}

        {!isOwn && listing.publisherId ? (
          <>
            {/* Chat (#45) adds /chats/new; enabled there. */}
            <Button mode="contained" icon="message-text-outline" disabled>
              Message {seller}
            </Button>
            <HelperText type="info" visible>
              Chat is coming soon.
            </HelperText>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  content: { maxWidth: 720, width: '100%', alignSelf: 'center', paddingBottom: 32 },
  photo: { width: '100%', aspectRatio: 4 / 3 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  body: { gap: 12, padding: 16 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  seller: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 8 },
});
