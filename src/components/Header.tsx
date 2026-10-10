import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const HIDE_AFTER = 120;
const TOLERANCE = 6;

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';

const NAV = [
  { label: 'Shop', href: '/shop' },
  { label: 'New', href: '#new' },
  { label: 'Lookbook', href: '#lookbook' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [heroHeight, setHeroHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0
  );

  const location = useLocation();
  const navigate = useNavigate();
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

  // Measure hero height so we know when to flip text color
  useEffect(() => {
    const measure = () => {
      const el = document.getElementById('hero');
      setHeroHeight(el ? el.offsetHeight : window.innerHeight);
    };
    measure();
    const el = document.getElementById('hero');
    let ro: ResizeObserver | undefined;
    if (el && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure);
      ro.observe(el);
    }
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ro?.disconnect();
    };
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const prev = lastY.current;
        const diff = y - prev;

        setScrolled(y);

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

  const overHero = scrolled < heroHeight - 1;
  const textClass = overHero ? 'text-white' : 'text-black';

  const scrollHomeTo = (id: string) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleNav = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (href === '#new') {
      scrollHomeTo('new');
      return;
    }

    if (href === '#about') {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-modal:about'));
        }, 100);
      } else {
        window.dispatchEvent(new CustomEvent('open-modal:about'));
      }
      return;
    }

    if (href === '#contact') {
      if (location.pathname !== '/') {
        navigate('/');
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('open-modal:contact'));
        }, 100);
      } else {
        window.dispatchEvent(new CustomEvent('open-modal:contact'));
      }
      return;
    }

    if (href === '#lookbook') {
      scrollHomeTo('lookbook');
      return;
    }

    navigate(href);
  };

  return (
    <>
      <header
        style={{
          backgroundColor: overHero ? 'transparent' : CREAM,
          borderBottom: overHero
            ? '1px solid transparent'
            : `1px solid ${CREAM_DARK}`,
        }}
        className={`fixed left-0 right-0 top-0 z-40 transition-[background-color,border-color,transform,color] duration-300 ease-out ${
          hidden && !overHero ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="mx-auto flex h-[56px] max-w-7xl items-center justify-between px-5 md:h-[72px] md:px-8 lg:px-10">
          {/* Hamburger (mobile only) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
            className={`-ml-2 flex h-10 w-10 items-center justify-center transition-colors duration-300 hover:opacity-70 lg:hidden ${textClass}`}
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
            <span
              className={`font-serif text-[18px] uppercase leading-none tracking-[0.18em] transition-colors duration-300 md:text-[20px] ${textClass}`}
            >
              KOVA
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center justify-center gap-9 lg:flex">
            {NAV.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={handleNav(item.href)}
                className={`whitespace-nowrap text-[11.5px] uppercase tracking-[0.16em] transition-colors duration-300 hover:text-[#C66B4F] ${textClass}`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right — search + cart */}
          <div className="flex items-center gap-1 md:gap-2">
            {/* Search */}
            <button
              aria-label="Search"
              onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
              className={`flex h-10 w-10 items-center justify-center transition-colors duration-300 hover:opacity-70 ${textClass}`}
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

            {/* Cart — clean handbag icon */}
            <button
              aria-label="Cart"
              onClick={() => window.dispatchEvent(new CustomEvent('open-cart'))}
              className={`relative flex h-10 w-10 items-center justify-center transition-colors duration-300 hover:opacity-70 ${textClass}`}
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
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8V6a3 3 0 016 0v2" />
              </svg>
              {cartCount > 0 && (
                <span
                  className={`absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold leading-none transition-colors duration-300 ${
                    overHero
                      ? 'bg-white text-black'
                      : 'bg-[#C66B4F] text-white'
                  }`}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU */}
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
              className="-ml-2 flex h-10 w-10 items-center justify-center text-black transition-opacity hover:opacity-60"
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
            <span className="font-serif text-[18px] uppercase leading-none tracking-[0.18em] text-black">
              KOVA
            </span>

            {/* Mobile cart — clean handbag icon */}
            <button
              aria-label="Cart"
              onClick={() => {
                setMobileMenuOpen(false);
                window.dispatchEvent(new CustomEvent('open-cart'));
              }}
              className="relative -mr-2 flex h-10 w-10 items-center justify-center text-black transition-opacity hover:opacity-60"
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
                <path d="M6 8h12l-1 12H7L6 8z" />
                <path d="M9 8V6a3 3 0 016 0v2" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#C66B4F] px-1 text-[9.5px] font-bold leading-none text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-8">
            <nav className="flex flex-col">
              {NAV.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={handleNav(item.href)}
                  className="flex items-center justify-between border-b border-[#EDE8E0] py-5 text-left font-serif text-[22px] tracking-[0.02em] text-black transition-colors hover:text-[#C66B4F]"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <div
            className="flex flex-shrink-0 items-center gap-5 px-6 py-5"
            style={{ borderTop: `1px solid ${CREAM_DARK}` }}
          >
            <a
              href="https://instagram.com/kova"
              target="_blank"
              rel="noreferrer"
              className="text-[11.5px] uppercase tracking-[0.14em] text-black/60 transition-colors hover:text-[#C66B4F]"
            >
              Instagram
            </a>
            <span className="text-black/20">·</span>
            <a
              href="https://tiktok.com/@kova"
              target="_blank"
              rel="noreferrer"
              className="text-[11.5px] uppercase tracking-[0.14em] text-black/60 transition-colors hover:text-[#C66B4F]"
            >
              TikTok
            </a>
          </div>
        </div>
      )}
    </>
  );
}