import { InMemoryProductStore } from '../InMemoryProductStore.js';
import { productStoreContract } from './productStoreContract.js';

productStoreContract('InMemoryProductStore', async () => new InMemoryProductStore());
