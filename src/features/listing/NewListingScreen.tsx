import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import {
  Button,
  Chip,
  HelperText,
  SegmentedButtons,
  Text,
  TextInput,
  useTheme,
} from 'react-native-paper';

import { CATEGORIES, CURRENCIES, CURRENCY_SYMBOLS, type Currency } from '@/domain/product';
import { useCurrentUser } from '@/features/auth/useCurrentUser';
import { useTakePhoto } from '@/features/camera/useTakePhoto';
import { listingExtractor } from '@/services/extraction';

import { useCreateListing } from './useCreateListing';

const MAX_DESCRIPTION = 300;

/** Fields the user changed by hand; those stop following the suggestions. */
interface Overrides {
  price?: string;
  currency?: Currency;
  category?: string | null;
  location?: string;
  hashtag?: string;
}

/**
 * Selling in three steps: photo → one sentence → Publish. Price, category, location and hashtags are
 * suggested from the sentence and can be corrected.
 */
export function NewListingScreen() {
  const params = useLocalSearchParams<{ photoUri?: string }>();
  const theme = useTheme();
  const user = useCurrentUser();
  const { takePhoto } = useTakePhoto();
  const createListing = useCreateListing();

  const [photoUri, setPhotoUri] = useState<string | null>(params.photoUri ?? null);
  const [description, setDescription] = useState('');
  const [overrides, setOverrides] = useState<Overrides>({});

  const suggested = useMemo(() => listingExtractor.extract(description), [description]);
  const price = overrides.price ?? (suggested.price === null ? '' : String(suggested.price));
  const currency = overrides.currency ?? suggested.currency ?? 'ILS';
  const category = overrides.category !== undefined ? overrides.category : suggested.category;
  const location = overrides.location ?? suggested.location ?? '';
  const hashtag = overrides.hashtag ?? suggested.hashtag;
  const override = (patch: Overrides) => setOverrides((current) => ({ ...current, ...patch }));

  const trimmed = description.trim();
  const priceValue = price.trim() === '' ? null : Number(price.replace(/,/g, ''));
  const priceInvalid = priceValue !== null && (!Number.isFinite(priceValue) || priceValue < 0);
  const canPublish =
    trimmed.length >= 3 && !priceInvalid && user !== null && !createListing.isPending;
  const hasSuggestions =
    suggested.price !== null || suggested.category !== null || suggested.location !== null;

  const publish = () => {
    if (!canPublish || !user) return;
    createListing.mutate(
      {
        description: trimmed,
        hashtag: hashtag.trim(),
        imageUrl: photoUri,
        publisherId: user.id,
        price: priceValue,
        currency: priceValue === null ? null : currency,
        category,
        location: location.trim() || null,
      },
      {
        onSuccess: () => {
          if (router.canGoBack()) router.back();
          else router.replace('/');
        },
      },
    );
  };

  const changePhoto = async () => {
    const uri = await takePhoto();
    if (uri) setPhotoUri(uri);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {photoUri ? (
          <Image
            testID="new-listing-photo"
            source={{ uri: photoUri }}
            style={styles.photo}
            contentFit="cover"
            accessibilityLabel="Photo for the new listing"
          />
        ) : (
          <View
            style={[styles.photo, styles.noPhoto, { backgroundColor: theme.colors.surfaceVariant }]}
          >
            <Text variant="titleMedium">No photo</Text>
          </View>
        )}
        <Button mode="text" icon="camera" onPress={changePhoto}>
          {photoUri ? 'Retake photo' : 'Add photo'}
        </Button>

        <TextInput
          label="What are you selling?"
          accessibilityLabel="What are you selling?"
          placeholder="e.g. Suzuki Swift 2012, 25,000 ₪, Tel Aviv"
          mode="outlined"
          multiline
          value={description}
          onChangeText={(text) => setDescription(text.slice(0, MAX_DESCRIPTION))}
        />
        <HelperText type="info" visible>
          {hasSuggestions
            ? 'Filled in from your description. Tap a field to change it.'
            : `Mention the price and city and we'll fill them in. ${trimmed.length}/${MAX_DESCRIPTION}`}
        </HelperText>

        <TextInput
          label="Price"
          accessibilityLabel="Price"
          mode="outlined"
          keyboardType="numeric"
          value={price}
          onChangeText={(text) => override({ price: text })}
          error={priceInvalid}
        />
        <SegmentedButtons
          density="small"
          value={currency}
          onValueChange={(value) => override({ currency: value as Currency })}
          buttons={CURRENCIES.map((value) => ({
            value,
            label: `${CURRENCY_SYMBOLS[value]} ${value}`,
            accessibilityLabel: value,
          }))}
        />

        <Text variant="labelLarge">Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((value) => (
            <Chip
              key={value}
              mode="outlined"
              selected={category === value}
              showSelectedOverlay
              onPress={() => override({ category: category === value ? null : value })}
            >
              {value}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Location"
          accessibilityLabel="Location"
          mode="outlined"
          value={location}
          onChangeText={(text) => override({ location: text })}
        />
        <TextInput
          label="Hashtags"
          accessibilityLabel="Hashtags"
          placeholder="#bike #sport"
          mode="outlined"
          value={hashtag}
          onChangeText={(text) => override({ hashtag: text })}
        />

        <HelperText type="error" visible={createListing.isError}>
          Couldn&apos;t publish. Check your connection and try again.
        </HelperText>
        <Button
          mode="contained"
          onPress={publish}
          disabled={!canPublish}
          loading={createListing.isPending}
        >
          Publish
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { gap: 8, padding: 16, maxWidth: 640, width: '100%', alignSelf: 'center' },
  photo: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12 },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
