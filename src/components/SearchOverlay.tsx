import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchPublicProducts } from '../lib/store';
import { peekProducts, loadProducts } from '../lib/products-cache';
import { formatPrice } from '../config';
import type { Product } from '../types';

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';

export function SearchOverlay() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(
    () => peekProducts() ?? []
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Load products once
  useEffect(() => {
    let cancelled = false;
    loadProducts(() => fetchPublicProducts()).then((p) => {
      if (!cancelled) setProducts(p);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Listen for global "open-search" event
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('open-search', onOpen);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('open-search', onOpen);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  // Lock scroll + hide header while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      document.body.classList.add('search-open');
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
      document.body.classList.remove('search-open');
      setQuery('');
    }
    return () => {
      document.body.style.overflow = '';
      document.body.classList.remove('search-open');
    };
  }, [open]);

  const q = query.trim().toLowerCase();

  const results: Product[] = useMemo(() => {
    if (!q) return [];
    return products
      .filter((p) => {
        const name = p.name?.toLowerCase() ?? '';
        const desc = (p.description ?? '').toLowerCase();
        const cat = (p.category_id ?? '').toLowerCase();
        return name.includes(q) || desc.includes(q) || cat.includes(q);
      })
      .slice(0, 12);
  }, [products, q]);

  const goToShop = (searchTerm: string) => {
    setOpen(false);
    navigate(`/shop?q=${encodeURIComponent(searchTerm)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      goToShop(query.trim());
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* ── Top bar ── */}
      <div
        className="flex-shrink-0 px-5 py-5 sm:px-8 sm:py-6"
        style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
      >
        {/* Serif heading row */}
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-[28px] leading-none tracking-[-0.03em] text-charcoal sm:text-[36px]">
            Search
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close search"
            className="flex h-9 w-9 items-center justify-center text-charcoal/60 transition-colors duration-300 hover:text-charcoal"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-[18px] w-[18px]"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Input row */}
        <div className="flex items-center gap-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px] shrink-0 transition-colors duration-300"
            style={{ color: q ? TERRACOTTA : 'rgba(26,26,26,0.4)' }}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-4-4" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pieces, categories…"
            className="min-w-0 flex-1 bg-transparent text-[15px] font-medium text-charcoal outline-none placeholder:text-charcoal/35 sm:text-[17px]"
          />

          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear"
              className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.18em] text-charcoal/50 transition-colors duration-300 hover:text-terracotta"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Results ── */}
      <div className="flex-1 overflow-y-auto px-5 py-8 sm:px-8 sm:py-10">
        {!q ? (
          <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-charcoal/40">
            Start typing to search
          </p>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center gap-5 py-16 text-center">
            <p className="font-serif text-[22px] leading-tight tracking-[-0.02em] text-charcoal/70">
              No pieces match "{query}"
            </p>
            <button
              onClick={() => goToShop(query)}
              className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/70 underline-offset-4 transition-colors duration-300 hover:text-terracotta hover:underline"
            >
              Search all pieces anyway
            </button>
          </div>
        ) : (
          <>
            <p className="mb-6 text-[10.5px] font-bold uppercase tracking-[0.24em] text-charcoal/40">
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </p>

            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
              {results.map((p) => (
                <button
                  key={p.id}
                  onClick={() => goToShop(p.name)}
                  className="group flex flex-col text-left"
                >
                  <div
                    className="relative aspect-[4/5] w-full overflow-hidden rounded-sm"
                    style={{ backgroundColor: '#EFEAE2' }}
                  >
                    {p.image_url && (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    )}
                  </div>
                  <h3 className="mt-2 text-[12.5px] font-medium leading-[1.35] tracking-[-0.005em] text-charcoal">
                    {p.name}
                  </h3>
                  <p className="mt-0.5 font-numbers text-[12.5px] text-charcoal/55">
                    {formatPrice(p.price)}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-12 text-center">
              <button
                onClick={() => goToShop(query)}
                className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal/70 underline-offset-4 transition-colors duration-300 hover:text-terracotta hover:underline"
              >
                See all results in shop
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}