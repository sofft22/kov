import type { Product } from '../types';

/**
 * The exact logic StorePage uses to pick which products get featured.
 * Both StorePage and ShopPage call this so badges stay in sync.
 *
 * Returns Sets of product IDs. A product can be in one, both, or neither.
 */
export function computeFeaturedIds(products: Product[]) {
  const newIn = products.slice(0, 12);
  const ace = [...products].reverse().slice(0, 12);

  const newIds = new Set(newIn.map((p) => p.id));
  const aceIds = new Set(ace.map((p) => p.id));

  return { newIds, aceIds };
}