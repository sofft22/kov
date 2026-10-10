import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NavLinks } from './NavLinks';
import { useCart } from '../context/CartContext';

const HIDE_AFTER = 120;
const TOLERANCE = 6;

const CREAM = '#F5F1EA';
const CREAM_DARK = '#E8E2D8';

/**
 * PageHeader — used on all pages EXCEPT the homepage.
 * Shows only the 6 core product categories:
 * Women · Men · Native · Footwear · Bags · Accessories
 *
 * Always cream. Charcoal text. Hides on scroll-down, shows on scroll-up.
 */
export function PageHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  const location = useLocation();
  const { items } = useCart();
  const lastY = useRef(0);
  const ticking = useRef(false);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const prev = lastY.current;
        const diff = y - prev;

        if (y > HIDE_AFTER && diff > TOLERANCE) {
          setHidden(true);
        } else if (diff < -TOLERANCE || y <= HIDE_AFTER) {
          setHidden(false);
        }

        lastY.current = y;
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <header
        style={{
          backgroundColor: CREAM,
          borderBottom: `1px solid ${CREAM_DARK}`,
        }}
        className={`sticky top-0 z-40 transition-transform duration-300 ease-out ${
          hidden ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="mx-auto flex h-[56px] max-w-7xl items-center justify-between px-5 md:h-[72px] md:px-8 lg:px-10">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className="-ml-2 flex h-10 w-10 items-center justify-center text-charcoal transition-opacity hover:opacity-70 lg:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-[18px] w-[18px]"
            >
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" aria-label="KOVA home" className="flex items-center md:mr-16">
            <span className="font-serif text-[18px] uppercase leading-none tracking-[0.18em] text-charcoal md:text-[20px]">
              KOVA
            </span>
          </Link>

          {/* Center nav — 6 categories */}
          <NavLinks variant="desktop" textColor="black" />

          {/* Right side */}
          <div className="flex items-center gap-1 md:gap-2">
            <button
              aria-label="Search"
              onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
              className="flex h-10 w-10 items-center justify-center text-charcoal transition-opacity hover:opacity-70"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
            </button>

            <button
              aria-label="Cart"
              onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}
              className="relative flex h-10 w-10 items-center justify-center text-charcoal transition-opacity hover:opacity-70"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
              >
                <path d="M6 2l1.5 4h9L18 2" />
                <path d="M4 6h16l-1.5 14a2 2 0 01-2 1.8h-9A2 2 0 015.5 20L4 6z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-terracotta px-1 text-[9.5px] font-semibold leading-none text-cream">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── MOBILE MENU ─── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col lg:hidden"
          style={{ backgroundColor: CREAM }}
        >
          <div
            className="flex h-[56px] flex-shrink-0 items-center justify-between px-5"
            style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
          >
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="-ml-2 flex h-10 w-10 items-center justify-center text-charcoal transition-opacity hover:opacity-60"
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

            <span className="font-serif text-[18px] uppercase leading-none tracking-[0.18em] text-charcoal">
              KOVA
            </span>

            <button
              aria-label="Cart"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open-cart'));
              }}
              className="relative -mr-2 flex h-10 w-10 items-center justify-center text-charcoal transition-opacity hover:opacity-60"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-[18px] w-[18px]"
              >
                <path d="M6 2l1.5 4h9L18 2" />
                <path d="M4 6h16l-1.5 14a2 2 0 01-2 1.8h-9A2 2 0 015.5 20L4 6z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-terracotta px-1 text-[9.5px] font-semibold leading-none text-cream">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <NavLinks variant="mobile" onClose={() => setMobileMenuOpen(false)} />
          </div>

          <div
            className="flex flex-shrink-0 items-center gap-5 px-6 py-5"
            style={{ borderTop: `1px solid ${CREAM_DARK}` }}
          >
            <a
              href="https://instagram.com/kova"
              target="_blank"
              rel="noreferrer"
              className="text-[11.5px] uppercase tracking-[0.14em] text-charcoal/60 transition-colors hover:text-terracotta"
            >
              Instagram
            </a>
            <span className="text-charcoal/20">·</span>
            <a
              href="https://tiktok.com/@kova"
              target="_blank"
              rel="noreferrer"
              className="text-[11.5px] uppercase tracking-[0.14em] text-charcoal/60 transition-colors hover:text-terracotta"
            >
              TikTok
            </a>
          </div>
        </div>
      )}
    </>
  );
}