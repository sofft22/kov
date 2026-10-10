export interface Category {
  id: string;
  label: string;
}

export const CATEGORIES: Category[] = [
  { id: 'clothing',    label: 'Clothing' },
  { id: 'footwear',    label: 'Footwear' },
  { id: 'watches',     label: 'Watches' },
  { id: 'accessories', label: 'Accessories' },
];

/* Subcategory options — only apply when category is 'clothing' */
export const SUBCATEGORIES: { id: string; label: string }[] = [
  { id: 'tops',    label: 'Tops' },
  { id: 'bottoms', label: 'Bottoms' },
];

/* Mobile homepage slots — 4 rows, no accessories */
export const VIRTUAL_SLOTS_FULL = [
  'tops',
  'bottoms',
  'footwear',
  'watches',
] as const;

/* Tablet + desktop homepage slots — 3 rows */
export const VIRTUAL_SLOTS_REDUCED = [
  'tops',
  'bottoms',
  'footwear',
] as const;

export type VirtualSlot = typeof VIRTUAL_SLOTS_FULL[number];

/* Pick the right slot set per screen */
export function virtualSlotsFor(
  layout: 'mobile' | 'tablet' | 'desktop'
): readonly VirtualSlot[] {
  return layout === 'mobile' ? VIRTUAL_SLOTS_FULL : VIRTUAL_SLOTS_REDUCED;
}

/* Fallback keywords for older products without a subcategory set */
export const BOTTOMS_KEYWORDS = ['trouser', 'pant', 'short', 'jean', 'denim'];

/* Map a product to its virtual slot */
export function virtualSlotFor(product: {
  category_id: string;
  subcategory?: string | null;
  name: string;
}): VirtualSlot {
  if (product.category_id !== 'clothing') {
    return product.category_id as VirtualSlot;
  }
  const sub = (product.subcategory ?? '').toLowerCase();
  if (sub === 'tops' || sub === 'bottoms') return sub;
  const name = product.name.toLowerCase();
  if (BOTTOMS_KEYWORDS.some((k) => name.includes(k))) return 'bottoms';
  return 'tops';
}