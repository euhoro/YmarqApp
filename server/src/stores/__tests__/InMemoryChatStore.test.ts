import { InMemoryChatStore } from '../InMemoryChatStore.js';
import { chatStoreContract } from './chatStoreContract.js';

chatStoreContract('InMemoryChatStore', async () => new InMemoryChatStore());
