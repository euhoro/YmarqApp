import { randomUUID } from 'node:crypto';

import type { NewProduct, Product } from '../domain/product.js';
import type { ProductStore } from './ProductStore.js';

const SEARCHABLE = ['description', 'hashtag', 'category', 'location'] as const;

export class InMemoryProductStore implements ProductStore {
  private products: Product[] = [];

  async list(): Promise<Product[]> {
    return [...this.products].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async get(id: string): Promise<Product | null> {
    return this.products.find((product) => product.id === id) ?? null;
  }

  async search(query: string): Promise<Product[]> {
    const needle = query.trim().toLocaleLowerCase();
    const all = await this.list();
    if (!needle) return all;
    return all.filter((product) =>
      SEARCHABLE.some((field) => (product[field] ?? '').toLocaleLowerCase().includes(needle)),
    );
  }

  async create(input: NewProduct): Promise<Product> {
    const product: Product = { id: randomUUID(), createdAt: new Date(), ...input };
    this.products.push(product);
    return product;
  }

  async delete(id: string): Promise<boolean> {
    const before = this.products.length;
    this.products = this.products.filter((product) => product.id !== id);
    return this.products.length < before;
  }
}
