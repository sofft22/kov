import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

interface LocalOrder {
  token: string;
  orderId: string;
  date: string;
}

const LS_KEY = 'kova_my_orders_v1';

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.5)';

function readOrders(): LocalOrder[] {
  try {
    if (typeof window === 'undefined') return [];
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (o) => o && typeof o.token === 'string' && typeof o.orderId === 'string'
    );
  } catch {
    return [];
  }
}

export function MyOrdersPage() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  useEffect(() => {
    setOrders(readOrders());
  }, []);

  const handleClear = () => {
    if (window.confirm('Clear your saved orders from this device?')) {
      try {
        window.localStorage.removeItem(LS_KEY);
      } catch {
        // ignore
      }
      setOrders([]);
    }
  };

  return (
    <div className="min-h-screen bg-cream text-charcoal">
      <Helmet>
        <title>My Orders — KOVA</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main
        className="px-5 pt-32 pb-24 sm:px-8 sm:pt-36 sm:pb-28 lg:px-10"
        style={{ backgroundColor: CREAM }}
      >
        <div className="mx-auto max-w-2xl">
          {/* Header */}
          <div
            className="flex flex-wrap items-end justify-between gap-4 pb-6"
            style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
          >
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-[0.32em]"
                style={{ color: TERRACOTTA }}
              >
                Your orders
              </p>
              <h1 className="mt-4 font-serif text-[32px] leading-none tracking-[-0.02em] text-charcoal sm:text-[42px]">
                My Orders
              </h1>
            </div>

            {orders.length > 0 && (
              <button
                onClick={handleClear}
                className="pb-1 text-[10.5px] font-bold uppercase tracking-[0.18em] underline-offset-4 transition-colors duration-300"
                style={{ color: MUTED }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = TERRACOTTA;
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = MUTED;
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Clear history
              </button>
            )}
          </div>

          {/* Empty */}
          {orders.length === 0 ? (
            <div
              className="mt-14 p-10 text-center"
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              <p className="font-serif text-[22px] leading-tight tracking-[-0.01em] text-charcoal">
                No orders yet.
              </p>
              <p className="mt-3 text-[13.5px] leading-[1.7]" style={{ color: MUTED }}>
                Orders you place on this device will appear here.
              </p>
              <Link
                to="/shop"
                className="mt-7 inline-block text-[11px] font-bold uppercase tracking-[0.2em] underline-offset-4 transition-colors duration-300"
                style={{ color: CHARCOAL }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = TERRACOTTA;
                  e.currentTarget.style.textDecoration = 'underline';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = CHARCOAL;
                  e.currentTarget.style.textDecoration = 'none';
                }}
              >
                Browse the shop →
              </Link>
            </div>
          ) : (
            <>
              <ul className="mt-10 space-y-3">
                {orders.map((o) => (
                  <li key={o.token}>
                    <Link
                      to={`/order/${o.token}`}
                      className="group flex items-center justify-between gap-4 p-5 transition-colors duration-300"
                      style={{
                        border: `1px solid ${CREAM_DARK}`,
                        backgroundColor: CREAM,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = TERRACOTTA)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = CREAM_DARK)
                      }
                    >
                      <div className="min-w-0">
                        <p className="font-numbers text-[15px] leading-none tracking-[0.02em] text-charcoal">
                          {o.orderId}
                        </p>
                        <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
                          {new Date(o.date).toLocaleDateString('en-NG', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <span
                        className="flex shrink-0 items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 group-hover:text-terracotta"
                        style={{ color: MUTED }}
                      >
                        Track
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                        >
                          <path d="M5 12h14M13 5l7 7-7 7" />
                        </svg>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>

              <p
                className="mt-10 text-center text-[11px] leading-[1.7]"
                style={{ color: MUTED }}
              >
                Orders are saved on this device only. If you switch phones or
                clear your browser, they won't appear here.
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}