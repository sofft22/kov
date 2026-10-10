import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ProductCard } from '../components/ProductCard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Reveal } from '../components/Reveal';
import { Reviews } from '../components/Reviews';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import { fetchPublicProducts } from '../lib/store';
import {
  peekProducts,
  loadProducts,
  invalidateProducts,
} from '../lib/products-cache';
import {
  virtualSlotsFor,
  virtualSlotFor,
  type VirtualSlot,
} from '../config/categories';
import { formatPrice } from '../config';
import type { Product } from '../types';

const ProductModal = lazy(() =>
  import('../components/ProductModal').then((m) => ({ default: m.ProductModal }))
);

const CATEGORY_TILES = [
  { label: 'Clothing',    href: '/shop?category=clothing',    image: '/clothing.jpg' },
  { label: 'Footwear',    href: '/shop?category=footwear',    image: '/footwear.jpg' },
  { label: 'Watches',     href: '/shop?category=watches',     image: '/watches.jpg' },
  { label: 'Accessories', href: '/shop?category=accessories', image: '/accessories.jpg' },
];

const LOOKBOOK = [
  '/lookbook/1.jpg', '/lookbook/2.jpg', '/lookbook/3.jpg',
  '/lookbook/4.jpg', '/lookbook/5.jpg', '/lookbook/6.jpg',
  '/lookbook/7.jpg', '/lookbook/8.jpg', '/lookbook/9.jpg',
  '/lookbook/10.jpg', '/lookbook/11.jpg', '/lookbook/12.jpg',
];

const GRID_CLASS =
  'grid grid-cols-2 gap-x-4 gap-y-12 sm:grid-cols-3 sm:gap-x-6 sm:gap-y-14 lg:grid-cols-4 lg:gap-x-7 lg:gap-y-16';

/* Per-slot products by screen */
const PER_SLOT = { mobile: 2, tablet: 3, desktop: 4 };

function SkeletonGrid({ count = 12 }: { count?: number }) {
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

/* Arrange using the given slot set */
function arrangeBySlots(
  products: Product[],
  slots: readonly VirtualSlot[],
  perSlot: number
): Product[] {
  const bySlot = new Map<VirtualSlot, Product[]>();
  for (const s of slots) bySlot.set(s, []);

  for (const p of products) {
    const slot = virtualSlotFor(p as any);
    const list = bySlot.get(slot);
    if (list) list.push(p);
  }

  const result: Product[] = [];
  for (const s of slots) {
    const list = bySlot.get(s) ?? [];
    const take = Math.min(perSlot, list.length);
    for (let i = 0; i < take; i++) result.push(list[i]);
  }
  return result;
}

function useAceProducts(
  products: Product[],
  slots: readonly VirtualSlot[],
  perSlot: number
) {
  const [ace, setAce] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (products.length === 0) {
        setAce([]);
        return;
      }

      const sevenDaysAgo = new Date(
        Date.now() - 7 * 24 * 60 * 60 * 1000
      ).toISOString();

      const { data } = await supabase
        .from('cart_adds_log')
        .select('product_id, created_at')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (cancelled) return;

      const rows = (data ?? []) as { product_id: string; created_at: string }[];
      const recentCounts: Record<string, number> = {};
      const allTimeCounts: Record<string, number> = {};

      rows.forEach((r) => {
        allTimeCounts[r.product_id] = (allTimeCounts[r.product_id] ?? 0) + 1;
        if (r.created_at >= sevenDaysAgo) {
          recentCounts[r.product_id] = (recentCounts[r.product_id] ?? 0) + 1;
        }
      });

      const sortedNewest = [...products].sort((a, b) => {
        const at = new Date((a as any).created_at ?? 0).getTime();
        const bt = new Date((b as any).created_at ?? 0).getTime();
        return bt - at;
      });

      const bySlot = new Map<VirtualSlot, Product[]>();
      for (const s of slots) bySlot.set(s, []);
      sortedNewest.forEach((p) => {
        const slot = virtualSlotFor(p as any);
        const list = bySlot.get(slot);
        if (list) list.push(p);
      });

      for (const s of slots) {
        const list = bySlot.get(s) ?? [];
        list.sort((a, b) => {
          const aR = recentCounts[a.id] ?? 0;
          const bR = recentCounts[b.id] ?? 0;
          if (aR !== bR) return bR - aR;
          const aA = allTimeCounts[a.id] ?? 0;
          const bA = allTimeCounts[b.id] ?? 0;
          if (aA !== bA) return bA - aA;
          return 0;
        });
      }

      const result: Product[] = [];
      for (const s of slots) {
        const list = bySlot.get(s) ?? [];
        const take = Math.min(perSlot, list.length);
        for (let i = 0; i < take; i++) result.push(list[i]);
      }

      setAce(result);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [products, slots, perSlot]);

  return ace;
}

function useParallax(speed = 0.35) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const el = ref.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const scrolled = -rect.top;
          setOffset(scrolled * speed);
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [speed]);

  return { ref, offset };
}

export function StorePage() {
  const { settings } = useSettings();
  const { addToCart } = useCart();
  const layout = useLayout();

  const cachedProducts = peekProducts();
  const [products, setProducts] = useState<Product[]>(cachedProducts ?? []);
  const [loading, setLoading] = useState(!cachedProducts);
  const [openProduct, setOpenProduct] = useState<Product | null>(null);

  const parallax = useParallax(0.3);

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

  const slots = virtualSlotsFor(layout);
  const perSlot = PER_SLOT[layout];

  const newIn = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const at = new Date((a as any).created_at ?? 0).getTime();
      const bt = new Date((b as any).created_at ?? 0).getTime();
      return bt - at;
    });
    return arrangeBySlots(sorted, slots, perSlot);
  }, [products, slots, perSlot]);

  const ace = useAceProducts(products, slots, perSlot);

  const openChat = (product: Product) => {
    const msg = `Hi, I'm interested in ${product.name} (${formatPrice(product.price)}).`;
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <Helmet>
        <title>KOVA — Considered clothing.</title>
        <meta name="description" content="KOVA — considered clothing for the modern wardrobe. Nationwide delivery across Nigeria." />
      </Helmet>

      <style>{`
        @keyframes heroFadeUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-fade-up { animation: heroFadeUp 1.4s cubic-bezier(0.22, 1, 0.36, 1) both; }
        @keyframes scrollBounce {
          0%, 100% { transform: translateY(0); opacity: 0.5; }
          50%      { transform: translateY(7px); opacity: 1; }
        }
        .scroll-bounce { animation: scrollBounce 2.2s ease-in-out infinite; }
      `}</style>

      <Header />

      <section
        id="hero"
        ref={parallax.ref}
        className="relative flex h-[105vh] min-h-[560px] w-full items-end overflow-hidden bg-charcoal sm:h-[125vh] sm:min-h-[680px]"
      >
        <img
          src="/hero.jpg"
          alt="KOVA"
          className="absolute inset-0 h-full w-full object-cover object-top sm:object-[center_10%]"
          style={{
            transform: `translate3d(0, ${parallax.offset}px, 0) scale(1.1)`,
            willChange: 'transform',
          }}
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/35 to-black/80" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-28 sm:px-8 sm:pb-32 lg:px-10 lg:pb-36">
          <div className="hero-fade-up">
            <h1 className="font-serif text-[76px] leading-[0.88] tracking-[-0.045em] text-cream sm:text-[120px] lg:text-[168px]">
              KOVA
            </h1>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                to="/shop"
                className="inline-flex items-center gap-3 rounded-full bg-cream px-9 py-4 text-[11px] uppercase tracking-[0.22em] text-charcoal transition-colors hover:bg-charcoal hover:text-cream"
              >
                Shop now
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-3.5 w-3.5">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
              <span className="text-[11px] uppercase tracking-[0.22em] text-cream/70">
                Autumn / Winter
              </span>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-8 left-1/2 z-10 -translate-x-1/2 scroll-bounce">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="h-5 w-5 text-cream/70">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </section>

      <section id="new" className="scroll-mt-20 bg-cream">
        <div className="mx-auto max-w-7xl px-5 pt-28 pb-32 sm:px-8 sm:pt-40 sm:pb-44 lg:px-10">
          <Reveal>
            <div className="mb-16 flex items-end justify-between gap-4 sm:mb-24">
              <div>
                <p className="text-[10px] uppercase tracking-[0.34em] text-charcoal/45">New</p>
                <h2 className="mt-3 font-serif text-[38px] leading-none tracking-[-0.025em] text-charcoal sm:text-[56px]">
                  This Week
                </h2>
              </div>
              <Link to="/shop?category=new" className="group flex items-center gap-2 pb-1.5 text-[11px] uppercase tracking-[0.18em] text-charcoal/60 transition-colors hover:text-terracotta">
                See all
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>

          {loading ? (
            <SkeletonGrid count={perSlot * slots.length} />
          ) : newIn.length === 0 ? (
            <p className="text-[13px] text-charcoal/50">No pieces yet.</p>
          ) : (
            <div className={GRID_CLASS}>
              {newIn.map((p, i) => (
                <Reveal key={p.id} delay={i * 40}>
                  <ProductCard
                    product={p}
                    priority
                    forceBadge="New"
                    onClick={() => setOpenProduct(p)}
                    onChat={() => openChat(p)}
                    onAddToCart={() => addToCart(p, 1)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-5 pb-32 sm:px-8 sm:pb-44 lg:px-10">
          <Reveal>
            <div className="mb-16 text-center sm:mb-24">
              <p className="text-[10px] uppercase tracking-[0.34em] text-charcoal/45">Explore</p>
              <h2 className="mt-3 font-serif text-[38px] leading-none tracking-[-0.025em] text-charcoal sm:text-[56px]">
                Shop by category
              </h2>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5">
            {CATEGORY_TILES.map((cat, i) => (
              <Reveal key={cat.label} delay={i * 60}>
                <Link to={cat.href} className="group relative block aspect-[4/5] overflow-hidden bg-charcoal">
                  <img src={cat.image} alt={cat.label} loading="lazy" className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent transition-opacity duration-500 group-hover:from-black/75" />
                  <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-[22px] leading-none tracking-[-0.01em] text-cream sm:text-[26px]">
                        {cat.label}
                      </span>
                      <span className="translate-x-[-4px] text-cream/0 transition-all duration-500 group-hover:translate-x-0 group-hover:text-cream/90">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-4 w-4">
                          <path d="M5 12h14M13 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-charcoal text-cream">
        <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[720px]">
              <img
                src="/complete-the-look.jpg"
                alt="Complete the Look"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-top"
              />
            </div>
          </Reveal>
          <Reveal delay={150}>
            <div className="flex flex-col justify-center px-6 py-24 sm:px-14 sm:py-28 lg:px-24 lg:py-32">
              <p className="text-[10px] uppercase tracking-[0.36em] text-terracotta">Styled</p>
              <h2 className="mt-6 font-serif text-[44px] leading-[1.02] tracking-[-0.025em] text-cream sm:text-[60px] lg:text-[72px]">
                Complete
                <br />
                the Look.
              </h2>
              <p className="mt-8 max-w-[44ch] text-[15.5px] leading-[1.75] text-cream/70">
                Shirt, tailored shorts, boots, bag. One considered outfit —
                styled end to end, ready to wear out of the box.
              </p>
              <Link to="/shop" className="mt-12 inline-flex w-fit items-center gap-3 rounded-full border border-cream/40 px-9 py-4 text-[11px] uppercase tracking-[0.22em] text-cream transition-colors hover:bg-cream hover:text-charcoal">
                Shop the look
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-3.5 w-3.5">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="bg-cream">
        <div className="mx-auto max-w-7xl px-5 py-32 sm:px-8 sm:py-44 lg:px-10">
          <Reveal>
            <div className="mb-16 flex items-end justify-between gap-4 sm:mb-24">
              <div>
                <p className="text-[10px] uppercase tracking-[0.34em] text-charcoal/45">Chosen</p>
                <h2 className="mt-3 font-serif text-[38px] leading-none tracking-[-0.025em] text-charcoal sm:text-[56px]">
                  Ace
                </h2>
              </div>
              <Link to="/shop" className="group flex items-center gap-2 pb-1.5 text-[11px] uppercase tracking-[0.18em] text-charcoal/60 transition-colors hover:text-terracotta">
                See all
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1">
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>

          {loading ? (
            <SkeletonGrid count={perSlot * slots.length} />
          ) : ace.length === 0 ? (
            <p className="text-[13px] text-charcoal/50">No pieces yet.</p>
          ) : (
            <div className={GRID_CLASS}>
              {ace.map((p, i) => (
                <Reveal key={p.id} delay={i * 40}>
                  <ProductCard
                    product={p}
                    forceBadge="Ace"
                    onClick={() => setOpenProduct(p)}
                    onChat={() => openChat(p)}
                    onAddToCart={() => addToCart(p, 1)}
                  />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      <section id="lookbook" className="scroll-mt-20 bg-charcoal text-cream">
        <Reveal>
          <div className="mx-auto max-w-7xl px-5 pt-28 pb-16 text-center sm:px-8 sm:pt-40 sm:pb-20 lg:px-10">
            <p className="text-[10px] uppercase tracking-[0.36em] text-terracotta">KOVA</p>
            <h2 className="mt-6 font-serif text-[48px] leading-[0.98] tracking-[-0.03em] text-cream sm:text-[80px] lg:text-[104px]">
              The
              <span className="italic"> look </span>
              book.
            </h2>
            <p className="mx-auto mt-8 max-w-[46ch] text-[15px] leading-[1.75] text-cream/60 sm:text-[16px]">
              Moments from our studio, our streets, and the people who wear KOVA.
            </p>
          </div>
        </Reveal>

        <div className="sm:hidden">
          <Reveal>
            <div className="relative aspect-[4/5] w-full overflow-hidden">
              <img src={LOOKBOOK[0]} alt="" loading="lazy" className="h-full w-full object-cover" />
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-px bg-cream/10">
            {LOOKBOOK.slice(1, 7).map((src, i) => (
              <Reveal key={i} delay={i * 40}>
                <div className="group relative aspect-square overflow-hidden">
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.06]" />
                  <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <div className="hidden sm:grid sm:grid-cols-3 sm:gap-px sm:bg-cream/10 lg:hidden">
          {LOOKBOOK.slice(0, 9).map((src, i) => (
            <Reveal key={i} delay={i * 40}>
              <div className="group relative aspect-[4/5] overflow-hidden">
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.06]" />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />
              </div>
            </Reveal>
          ))}
        </div>

        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-px lg:bg-cream/10">
          {LOOKBOOK.slice(0, 12).map((src, i) => (
            <Reveal key={i} delay={i * 30}>
              <div className="group relative aspect-[4/5] overflow-hidden">
                <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-[1100ms] ease-out group-hover:scale-[1.06]" />
                <div className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/20" />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reviews products={products} onOpenProduct={setOpenProduct} />

      <Footer />

      {openProduct && (
        <Suspense fallback={null}>
          <ProductModal
            product={openProduct}
            products={products}
            onClose={() => setOpenProduct(null)}
            onAddToCart={(qty, variant, variantPriceDelta, opts) => {
              addToCart(openProduct, qty, variant, variantPriceDelta, opts);
            }}
            onOpenProduct={(p) => setOpenProduct(p)}
          />
        </Suspense>
      )}
    </div>
  );
}