import { fireEvent, render, screen } from '@testing-library/react-native';
import { PaperProvider } from 'react-native-paper';

import type { Product } from '@/domain/product';

import { ProductList, type ProductListProps } from '../ProductList';

const PRODUCTS: Product[] = [
  {
    id: 'a',
    description: 'Suzuki Swift',
    hashtag: 'Nice car',
    imageUrl: null,
    publisherId: null,
  },
  {
    id: 'b',
    description: 'Mountain bike',
    hashtag: '#bike',
    imageUrl: 'https://example.com/bike.jpg',
    publisherId: 'u1',
  },
];

function renderList(props: Partial<ProductListProps> = {}) {
  const all: ProductListProps = {
    products: PRODUCTS,
    isLoading: false,
    error: null,
    onRetry: jest.fn(),
    refreshing: false,
    onRefresh: jest.fn(),
    ...props,
  };
  return render(
    <PaperProvider>
      <ProductList {...all} />
    </PaperProvider>,
  ).then(() => all);
}

describe('ProductList', () => {
  it('shows a spinner while loading', async () => {
    await renderList({ isLoading: true });

    expect(screen.getByTestId('products-loading')).toBeTruthy();
    expect(screen.queryByTestId('products-list')).toBeNull();
  });

  it('shows the error with a working Retry button', async () => {
    const props = await renderList({ error: new Error('Server down') });

    expect(screen.getByText('Server down')).toBeTruthy();
    await fireEvent.press(screen.getByText('Retry'));

    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it('shows the empty state', async () => {
    await renderList({ products: [] });

    expect(screen.getByText('No products yet')).toBeTruthy();
  });

  it('shows a card per product with description, hashtag and image or placeholder', async () => {
    await renderList();

    expect(screen.getByTestId('product-card-a')).toBeTruthy();
    expect(screen.getByText('Suzuki Swift')).toBeTruthy();
    expect(screen.getByText('Nice car')).toBeTruthy();
    expect(screen.getByTestId('product-image-placeholder-a')).toBeTruthy();

    expect(screen.getByText('Mountain bike')).toBeTruthy();
    expect(screen.getByTestId('product-image-b')).toBeTruthy();
  });

  it('calls onRefresh on pull-to-refresh', async () => {
    const props = await renderList();

    await fireEvent(screen.getByTestId('products-list'), 'refresh');

    expect(props.onRefresh).toHaveBeenCalledTimes(1);
  });
});
