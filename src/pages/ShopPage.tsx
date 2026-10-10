import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '../components/Header';
import { ProductCard } from '../components/ProductCard';
import { Reveal } from '../components/Reveal';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { CATEGORIES } from '../config/categories';
import { computeFeaturedIds } from '../lib/featured';
import { fetchPublicProducts } from '../lib/store';
import {
  peekProducts,
  loadProducts,
  invalidateProducts,
} from '../lib/products-cache';
import { formatPrice } from '../config';
import type { Product } from '../types';

const ProductModal = lazy(() =>
  import('../components/ProductModal').then((m) => ({ default: m.ProductModal }))
);

type SortKey = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'name';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'featured', label: 'Featured' },
  { key: 'newest', label: 'Newest' },
  { key: 'price-asc', label: 'Price: low to high' },
  { key: 'price-desc', label: 'Price: high to low' },
  { key: 'name', label: 'Name A–Z' },
];

const COLS = { mobile: 2, tablet: 3, desktop: 3 };
const ROWS = 5;

const BASE_URL = 'https://kova.ng';

const GRID_CLASS =
  'grid grid-cols-2 gap-x-2 gap-y-10 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-14 lg:grid-cols-3 lg:gap-x-6 lg:gap-y-16';

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';

function useLayout(): 'mobile' | 'tablet' | 'desktop' {
  const [layout, setLayout] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w >= 1024) setLayout('desktop');
      else if (w >= 640) setLayout('tablet');
      else setLayout('mobile');
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return layout;
}

function SkeletonGrid({ count = 10 }: { count?: number }) {
  return (
    <div className={GRID_CLASS}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col">
          <div className="aspect-[4/5] w-full animate-pulse bg-cream-dark/60" />
          <div className="mt-4 h-3 w-3/4 animate-pulse bg-cream-dark/60" />
          <div className="mt-2 h-3 w-1/3 animate-pulse bg-cream-dark/60" />
        </div>
      ))}
    </div>
  );
}

function resolveTitle(activeCategory: string) {
  if (activeCategory === 'all') return 'Shop';
  const found = CATEGORIES.find((c) => c.id === activeCategory);
  return found?.label ?? 'Shop';
}

export function ShopPage() {
  const { settings } = useSettings();
  const { addToCart } = useCart();
  const [params, setParams] = useSearchParams();

  const cachedProducts = peekProducts();
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [loading, setLoading] = useState(!cachedProducts);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [sortOpen, setSortOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const layout = useLayout();
  const perPage = COLS[layout] * ROWS;

  const activeCategory = params.get('category') ?? 'all';
  const query = (params.get('q') ?? '').trim();
  const queryLower = query.toLowerCase();
  const sort = (params.get('sort') as SortKey) || 'featured';
  const page = Math.max(1, parseInt(params.get('page') ?? '1', 10) || 1);

  useEffect(() => {
    let cancelled = false;
    loadProducts(() => fetchPublicProducts()).then((p) => {
      if (!cancelled) {
        setProducts(p);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      invalidateProducts();
      loadProducts(() => fetchPublicProducts())
        .then((p) => setProducts(p))
        .catch(() => {});
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, []);

  const { aceIds } = useMemo(() => computeFeaturedIds(products), [products]);

  const badgeFor = (productId: string): string | null => {
    if (aceIds.has(productId)) return 'Ace';
    return null;
  };

  const filtered = useMemo(() => {
    let list = products;

    if (queryLower) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(queryLower) ||
          (p.description ?? '').toLowerCase().includes(queryLower)
      );
    } else if (activeCategory !== 'all') {
      list = list.filter((p) => p.category_id === activeCategory);
    }

    const sorted = [...list];
    switch (sort) {
      case 'featured':
        sorted.sort((a, b) => {
          const ao = (a as any).sort_order;
          const bo = (b as any).sort_order;
          const aHas = ao != null;
          const bHas = bo != null;

          if (aHas && bHas) return ao - bo;
          if (aHas) return -1;
          if (bHas) return 1;

          const at = new Date((a as any).created_at ?? 0).getTime();
          const bt = new Date((b as any).created_at ?? 0).getTime();
          return bt - at;
        });
        break;

      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;

      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;

      case 'name':
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case 'newest':
        sorted.sort((a, b) => {
          const at = new Date((a as any).created_at ?? 0).getTime();
          const bt = new Date((b as any).created_at ?? 0).getTime();
          return bt - at;
        });
        break;

      default:
        break;
    }
    return sorted;
  }, [products, activeCategory, queryLower, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);

  const visible = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return filtered.slice(start, start + perPage);
  }, [filtered, currentPage, perPage]);

  const setCategory = (id: string) => {
    const next = new URLSearchParams(params);
    if (id === 'all') next.delete('category');
    else next.set('category', id);
    next.delete('page');
    setParams(next);
    setCatOpen(false);
  };

  const setSort = (key: SortKey) => {
    const next = new URLSearchParams(params);
    if (key === 'featured') next.delete('sort');
    else next.set('sort', key);
    next.delete('page');
    setParams(next);
    setSortOpen(false);
  };

  const setPage = (p: number) => {
    const next = new URLSearchParams(params);
    if (p <= 1) next.delete('page');
    else next.set('page', String(p));
    setParams(next);
    const el = document.getElementById('hero');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearSearch = () => {
    const next = new URLSearchParams(params);
    next.delete('q');
    next.delete('page');
    setParams(next);
  };

  const openChat = (product: Product) => {
    const msg = `Hi, I'm interested in ${product.name} (${formatPrice(product.price)}).`;
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  const activeSortLabel = SORTS.find((s) => s.key === sort)?.label ?? 'Featured';
  const title = useMemo(() => resolveTitle(activeCategory), [activeCategory]);
  const itemCount = filtered.length;

  const pickerOptions = useMemo(
    () => [
      { id: 'all', label: 'All categories' },
      ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
    ],
    []
  );

  const pageNumbers = useMemo(() => {
    const pages: (number | '…')[] = [];
    const max = totalPages;
    const cur = currentPage;
    if (max <= 7) {
      for (let i = 1; i <= max; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    if (cur > 3) pages.push('…');
    const start = Math.max(2, cur - 1);
    const end = Math.min(max - 1, cur + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (cur < max - 2) pages.push('…');
    pages.push(max);
    return pages;
  }, [totalPages, currentPage]);

  const pageTitle = query
    ? `Search: "${query}" — KOVA`
    : activeCategory === 'all'
    ? 'Shop — KOVA'
    : `${title} — KOVA`;

  const pageDescription = query
    ? `Search results for "${query}" on KOVA.`
    : activeCategory === 'all'
    ? 'Browse all pieces at KOVA. Nationwide delivery across Nigeria.'
    : `Shop ${title.toLowerCase()} at KOVA.`;

  const canonicalHref =
    activeCategory !== 'all' && !query
      ? `${BASE_URL}/shop?category=${activeCategory}`
      : `${BASE_URL}/shop`;

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalHref} />
      </Helmet>

      <Header />

      <section id="hero" className="bg-charcoal text-cream">
        <div className="mx-auto max-w-7xl px-5 pt-24 pb-6 sm:px-8 sm:pt-32 sm:pb-8 lg:px-10">
          {query ? (
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <button
                  onClick={clearSearch}
                  aria-label="Back to shop"
                  className="flex h-8 w-8 shrink-0 items-center justify-center text-cream transition-opacity hover:opacity-70"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-cream/50">
                    Search
                  </p>
                  <h1 className="mt-2 truncate font-serif text-[28px] leading-tight tracking-[-0.025em] text-cream sm:text-[38px]">
                    "{query}"
                  </h1>
                  <p className="mt-2 text-[12px] font-medium text-cream/50">
                    {itemCount} {itemCount === 1 ? 'result' : 'results'}
                  </p>
                </div>
              </div>
              <button
                onClick={clearSearch}
                className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.18em] text-cream/60 transition-colors hover:text-cream"
              >
                Clear
              </button>
            </div>
          ) : (
            <div className="flex items-end justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCatOpen(true)}
                  aria-label="Choose category"
                  className="group flex min-w-0 items-center gap-3 text-left"
                >
                  <h1 className="font-serif text-[36px] leading-none tracking-[-0.03em] text-cream sm:text-[52px]">
                    {title}
                  </h1>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mt-1 h-4 w-4 shrink-0 text-cream/60 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:text-cream sm:h-5 sm:w-5"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                <p className="pb-1 text-[9.5px] font-bold uppercase tracking-[0.2em] text-cream/40 sm:text-[10px]">
                  {itemCount} {itemCount === 1 ? 'PIECE' : 'PIECES'}
                </p>

                <div className="relative">
                  <button
                    onClick={() => setSortOpen((v) => !v)}
                    aria-label={`Sort by ${activeSortLabel}`}
                    className="flex h-8 w-8 items-center justify-center text-cream transition-opacity hover:opacity-70"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-[15px] w-[15px]"
                    >
                      <path d="M8 4v16M4 8l4-4 4 4" />
                      <path d="M16 20V4M12 16l4 4 4-4" />
                    </svg>
                  </button>

                  {sortOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-30"
                        onClick={() => setSortOpen(false)}
                        aria-hidden
                      />
                      <div className="absolute right-0 top-full z-40 mt-3 w-[220px] rounded-md border border-cream/15 bg-charcoal py-1 shadow-2xl">
                        {SORTS.map((s) => (
                          <button
                            key={s.key}
                            onClick={() => setSort(s.key)}
                            className={`block w-full px-4 py-2.5 text-left text-[12.5px] transition-colors ${
                              sort === s.key
                                ? 'bg-cream/10 font-bold text-cream'
                                : 'text-cream/70 hover:bg-cream/5 hover:text-cream'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {catOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => setCatOpen(false)}
            aria-hidden
          />

          <div className="fixed inset-0 z-50 hidden items-center justify-center p-6 sm:flex">
            <div className="pointer-events-auto w-full max-w-[360px] rounded-md border border-cream/15 bg-charcoal py-2 shadow-2xl">
              <p className="border-b border-cream/10 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.28em] text-cream/50">
                Choose category
              </p>
              <div className="max-h-[60vh] overflow-y-auto py-1">
                {pickerOptions.map((o) => {
                  const active = o.id === activeCategory;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setCategory(o.id)}
                      className={`flex w-full items-center justify-between px-5 py-3 text-left text-[13px] transition-colors ${
                        active
                          ? 'bg-cream/10 font-bold text-cream'
                          : 'text-cream/75 hover:bg-cream/5 hover:text-cream'
                      }`}
                    >
                      <span>{o.label}</span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-50 sm:hidden">
            <div className="rounded-t-2xl border-t border-cream/10 bg-charcoal pt-2 pb-6 shadow-2xl">
              <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cream/20" />
              <p className="px-6 pb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-cream/50">
                Choose category
              </p>
              <div className="max-h-[60vh] overflow-y-auto">
                {pickerOptions.map((o) => {
                  const active = o.id === activeCategory;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setCategory(o.id)}
                      className={`flex w-full items-center justify-between px-6 py-4 text-left font-serif text-[20px] tracking-[0.01em] transition-colors ${
                        active
                          ? 'text-cream'
                          : 'text-cream/60 hover:text-cream'
                      }`}
                    >
                      <span>{o.label}</span>
                      {active && (
                        <span className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <section className="mx-auto max-w-7xl px-5 pt-14 pb-24 sm:px-8 sm:pt-20 lg:px-10">
        {loading ? (
          <SkeletonGrid count={perPage} />
        ) : visible.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-[13.5px] font-medium text-charcoal/50">
              {query
                ? `No pieces match "${query}".`
                : 'No pieces in this collection yet.'}
            </p>
          </div>
        ) : (
          <div className={GRID_CLASS}>
            {visible.map((p, i) => (
              <Reveal key={p.id} delay={i * 30}>
                <ProductCard
                  product={p}
                  priority={i < 4}
                  forceBadge={badgeFor(p.id)}
                  showDiscount
                  onClick={() => setOpenProduct(p)}
                  onChat={() => openChat(p)}
                  onAddToCart={() => addToCart(p, 1)}
                />
              </Reveal>
            ))}
          </div>
        )}

        {totalPages > 1 && !loading && (
          <nav className="mt-16 flex items-center justify-center gap-1">
            <button
              onClick={() => setPage(currentPage - 1)}
              disabled={currentPage === 1}
              aria-label="Previous page"
              className="flex h-9 min-w-9 items-center justify-center px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal/50 transition-colors hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            {pageNumbers.map((p, idx) =>
              p === '…' ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="flex h-9 min-w-9 items-center justify-center px-2 text-[11px] text-charcoal/40"
                >
                  …
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  aria-label={`Page ${p}`}
                  aria-current={p === currentPage ? 'page' : undefined}
                  className={`flex h-9 min-w-9 items-center justify-center px-2 text-[11px] font-bold uppercase tracking-[0.14em] transition-colors ${
                    p === currentPage ? 'text-charcoal' : 'text-charcoal/45 hover:text-charcoal'
                  }`}
                >
                  {p}
                </button>
              )
            )}

            <button
              onClick={() => setPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              aria-label="Next page"
              className="flex h-9 min-w-9 items-center justify-center px-2 text-[11px] font-bold uppercase tracking-[0.14em] text-charcoal/50 transition-colors hover:text-charcoal disabled:cursor-not-allowed disabled:opacity-30"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-3.5 w-3.5">
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </nav>
        )}
      </section>

      <section
        className="px-5 py-20 sm:px-8 sm:py-28 lg:px-10"
        style={{ borderTop: `1px solid ${CREAM_DARK}`, backgroundColor: CREAM }}
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-12 sm:flex-row sm:items-start sm:justify-between sm:gap-16">
            <div className="sm:max-w-[280px]">
              <p className="font-serif text-[20px] uppercase leading-none tracking-[0.18em] text-charcoal md:text-[22px]">
                KOVA
              </p>
              <p className="mt-5 text-[13px] leading-[1.7] text-charcoal/55">
                Considered clothing.
              </p>
            </div>

            <div className="sm:max-w-[400px] sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-terracotta">
                Newsletter
              </p>
              <p className="mt-4 font-serif text-[18px] leading-[1.2] tracking-[-0.01em] text-charcoal sm:text-[22px]">
                New drops, restocks, and sales.
              </p>
              <form
                onSubmit={handleSubscribe}
                className="mt-5 flex items-center gap-3 pb-3 transition-colors focus-within:border-charcoal/60 sm:ml-auto sm:max-w-[340px]"
                style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-transparent text-[13.5px] text-charcoal outline-none placeholder:text-charcoal/35 sm:text-left"
                />
                <button
                  type="submit"
                  className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.2em] text-charcoal transition-colors duration-300"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = TERRACOTTA)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = CHARCOAL)
                  }
                >
                  {subscribed ? 'Joined ✓' : 'Join →'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {openProduct && (
        <Suspense fallback={null}>
          <ProductModal
            product={openProduct}
            products={products}
            onClose={() => setOpenProduct(null)}
            onAddToCart={(qty, variant, variantPriceDelta, opts) =>
              addToCart(openProduct, qty, variant, variantPriceDelta, opts)
            }
            onOpenProduct={(p) => setOpenProduct(p)}
          />
        </Suspense>
      )}
    </div>
  );
}