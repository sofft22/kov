import { useEffect, useState } from 'react';
import { fetchPublicProducts } from '../lib/store';
import { peekProducts, loadProducts } from '../lib/products-cache';
import type { Product } from '../types';

export function useProducts() {
  const cached = peekProducts();
  const [products, setProducts] = useState<Product[]>(cached ?? []);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    loadProducts(() => fetchPublicProducts())
      .then((p) => {
        if (cancelled) return;
        setProducts(p);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { products, loading };
}