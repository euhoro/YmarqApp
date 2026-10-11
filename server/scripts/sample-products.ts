import type { NewProduct } from '../src/domain/product.js';

const photo = (id: number) => `https://picsum.photos/id/${id}/800/450`;

/** The same sample listings the app's fake repository shows, for a demo database. */
export const SAMPLE_PRODUCTS: NewProduct[] = [
  {
    publisherId: 'demo-dana',
    description: 'MacBook Air 13", like new',
    hashtag: '#laptop #apple',
    imageUrl: photo(0),
    price: 3500,
    currency: 'ILS',
    category: 'Electronics',
    location: 'Haifa',
  },
  {
    publisherId: 'demo-user',
    description: 'Wooden dining table, seats 8',
    hashtag: '#furniture',
    imageUrl: photo(42),
    price: 1200,
    currency: 'ILS',
    category: 'Furniture',
    location: 'Ramat Gan',
  },
  {
    publisherId: 'demo-yossi',
    description: 'Record player, works great',
    hashtag: '#vinyl #music',
    imageUrl: photo(39),
    price: 450,
    currency: 'ILS',
    category: 'Electronics',
    location: 'Tel Aviv',
  },
  {
    publisherId: 'demo-avi',
    description: 'Classic car, restored',
    hashtag: '#car #classic',
    imageUrl: photo(111),
    price: 85000,
    currency: 'ILS',
    category: 'Vehicles',
    location: 'Jerusalem',
  },
];
