import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Header } from '../components/Header';
import { fetchOrderByToken, type TrackedOrder } from '../lib/store';
import { downloadOrderReceipt } from '../lib/receipt';
import { formatPrice } from '../config';

const STATUS_STEPS = ['placed', 'processing', 'delivered'] as const;

const STATUS_LABEL: Record<string, string> = {
  placed: 'Order placed',
  processing: 'Processing',
  delivered: 'Delivered',
};

const STATUS_HINT: Record<string, string> = {
  placed: 'We received your order.',
  processing: 'Preparing your items.',
  delivered: 'Your order has arrived.',
};

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.5)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const ERROR = '#B42828';

function statusIndex(status: string): number {
  const s = status.toLowerCase();
  if (s === 'delivered') return 2;
  if (s === 'shipped' || s === 'processing' || s === 'confirmed') return 1;
  return 0;
}

export function OrderTrackingPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      const o = await fetchOrderByToken(token);
      if (!cancelled) {
        setOrder(o);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleDownloadReceipt = async () => {
    if (order) await downloadOrderReceipt(order);
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream text-charcoal">
      <Helmet>
        <title>
          {order ? `Order ${order.order_id} — KOVA` : 'Order tracking — KOVA'}
        </title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      <Header />

      <main
        className="flex-1 px-5 pt-32 pb-24 sm:px-8 sm:pt-36 sm:pb-28 lg:px-10"
        style={{ backgroundColor: CREAM }}
      >
        <div className="mx-auto max-w-2xl">
          {loading ? (
            <div className="space-y-4">
              <div className="h-6 w-48 animate-pulse" style={{ backgroundColor: CREAM_DARK }} />
              <div className="h-4 w-32 animate-pulse" style={{ backgroundColor: CREAM_DARK }} />
              <div className="mt-6 h-32 w-full animate-pulse" style={{ backgroundColor: CREAM_DARK }} />
              <div className="h-32 w-full animate-pulse" style={{ backgroundColor: CREAM_DARK }} />
            </div>
          ) : !order ? (
            <div className="mx-auto max-w-md text-center">
              <p
                className="text-[10px] font-bold uppercase tracking-[0.28em]"
                style={{ color: TERRACOTTA }}
              >
                Order not found
              </p>
              <h1 className="mt-3 font-serif text-[26px] leading-tight tracking-[-0.02em] text-charcoal sm:text-[32px]">
                We couldn't find this order
              </h1>
              <p className="mt-4 text-[13px] leading-[1.7] sm:text-[14px]" style={{ color: MUTED }}>
                Double check the link, or view all your orders on this device.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                <Link
                  to="/my-orders"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                  style={{ backgroundColor: CHARCOAL, color: CREAM }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = TERRACOTTA)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = CHARCOAL)
                  }
                >
                  View my orders
                </Link>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal transition-colors duration-300"
                  style={{ border: `1px solid ${CHARCOAL}` }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = CHARCOAL;
                    e.currentTarget.style.color = CREAM;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = CHARCOAL;
                  }}
                >
                  Back home
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p
                    className="text-[10px] font-bold uppercase tracking-[0.28em]"
                    style={{ color: TERRACOTTA }}
                  >
                    Order tracking
                  </p>
                  <h1 className="mt-2 font-serif text-[26px] leading-tight tracking-[-0.02em] text-charcoal sm:text-[32px]">
                    {order.order_id}
                  </h1>
                  <p className="mt-1.5 text-[12px]" style={{ color: MUTED }}>
                    {new Date(order.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>

                {order.status === 'delivered' && (
                  <button
                    onClick={handleDownloadReceipt}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.16em] text-charcoal transition-colors duration-300"
                    style={{ border: `1px solid ${CHARCOAL}` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = CHARCOAL;
                      e.currentTarget.style.color = CREAM;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = CHARCOAL;
                    }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-[13px] w-[13px]">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                    Download receipt
                  </button>
                )}
              </div>

              {order.status !== 'cancelled' ? (
                <div
                  className="mt-6 p-5 sm:p-6"
                  style={{
                    border: `1px solid ${CREAM_DARK}`,
                    backgroundColor: CREAM,
                  }}
                >
                  <div className="flex items-start justify-between gap-3 sm:gap-6">
                    {STATUS_STEPS.map((step, i) => {
                      const currentIdx = statusIndex(order.status);
                      const done = i <= currentIdx;
                      return (
                        <div
                          key={step}
                          className="flex flex-1 flex-col items-center text-center"
                        >
                          <div
                            className="flex h-9 w-9 items-center justify-center text-[12px] font-bold transition-colors sm:h-10 sm:w-10 sm:text-[13px]"
                            style={{
                              backgroundColor: done ? CHARCOAL : CREAM,
                              border: `1px solid ${done ? CHARCOAL : CREAM_DARK}`,
                              color: done ? CREAM : MUTED_SOFT,
                            }}
                          >
                            {done ? '✓' : i + 1}
                          </div>
                          <p
                            className="mt-3 text-[11px] font-bold uppercase leading-tight tracking-[0.1em] sm:text-[12px]"
                            style={{ color: done ? CHARCOAL : MUTED_SOFT }}
                          >
                            {STATUS_LABEL[step]}
                          </p>
                          <p
                            className="mt-1 text-[10px] leading-[1.4] sm:text-[11px]"
                            style={{ color: done ? MUTED : MUTED_SOFT }}
                          >
                            {STATUS_HINT[step]}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div
                  className="mt-6 px-5 py-4 text-center"
                  style={{
                    border: `1px solid ${ERROR}33`,
                    backgroundColor: '#FBEDED',
                  }}
                >
                  <p
                    className="text-[11px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: ERROR }}
                  >
                    This order was cancelled
                  </p>
                </div>
              )}

              <div
                className="mt-6 p-5 sm:p-6"
                style={{
                  border: `1px solid ${CREAM_DARK}`,
                  backgroundColor: CREAM,
                }}
              >
                <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal">
                  Items
                </h2>
                <ul className="mt-4 space-y-3.5">
                  {(Array.isArray(order.items) ? order.items : []).map(
                    (it: any, i: number) => {
                      const name = it?.name ?? 'Item';
                      const qty = it?.qty ?? it?.quantity ?? 1;
                      const price = it?.price ?? 0;
                      const variant = it?.variant ?? null;
                      const image = it?.image_url ?? null;

                      return (
                        <li key={i} className="flex items-center gap-3">
                          {image && (
                            <img
                              src={image}
                              alt={`${name} — KOVA`}
                              loading="lazy"
                              decoding="async"
                              className="h-12 w-12 flex-shrink-0 object-contain"
                              style={{ backgroundColor: CREAM_DARK }}
                            />
                          )}
                          <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-[11.5px] font-normal uppercase tracking-[0.08em] text-charcoal">
                                {name}
                              </p>
                              <p className="mt-0.5 text-[11px]" style={{ color: MUTED }}>
                                Qty {qty}
                                {variant ? ` · ${variant}` : ''}
                              </p>
                            </div>
                            <p className="font-numbers text-[12.5px] text-charcoal">
                              {formatPrice(price * qty)}
                            </p>
                          </div>
                        </li>
                      );
                    }
                  )}
                </ul>

                <div
                  className="mt-6 grid grid-cols-2 gap-4 pt-5 sm:gap-8"
                  style={{ borderTop: `1px solid ${CREAM_DARK}` }}
                >
                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal">
                      Summary
                    </h2>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex justify-between gap-2 text-[11.5px] sm:text-[12px]" style={{ color: MUTED }}>
                        <span>Subtotal</span>
                        <span className="font-numbers text-charcoal">
                          {formatPrice(order.subtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-2 text-[11.5px] sm:text-[12px]" style={{ color: MUTED }}>
                        <span>Shipping</span>
                        <span className="font-numbers text-charcoal">
                          {formatPrice(order.shipping_price)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between gap-2 pt-2 text-[13.5px] font-medium text-charcoal sm:text-[14px]"
                        style={{ borderTop: `1px solid ${CREAM_DARK}` }}
                      >
                        <span className="uppercase tracking-[0.16em]">Total</span>
                        <span className="font-numbers">
                          {formatPrice(order.total)}
                        </span>
                      </div>
                      <p
                        className="pt-1 text-[10px] uppercase tracking-[0.14em] sm:text-[10.5px]"
                        style={{ color: MUTED_SOFT }}
                      >
                        {order.payment_method} · {order.payment_status}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal">
                      Delivering to
                    </h2>
                    <div
                      className="mt-3 text-[11.5px] leading-[1.6] sm:text-[12.5px]"
                      style={{ color: MUTED }}
                    >
                      <p className="font-medium text-charcoal">
                        {order.customer_name}
                      </p>
                      <p>{order.customer_phone}</p>
                      <p>
                        {order.address}
                        {order.apartment ? `, ${order.apartment}` : ''}
                      </p>
                      <p>
                        {order.city}, {order.state}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust row — outlined, no pink */}
              <div
                className="mt-6 grid grid-cols-3 gap-2 px-3 py-5 text-center sm:gap-3 sm:px-4"
                style={{
                  border: `1px solid ${CREAM_DARK}`,
                  backgroundColor: CREAM,
                }}
              >
                <TrustItem
                  label="Verified order"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="M9 12l2 2 4-4" />
                    </svg>
                  }
                />
                <TrustItem
                  label="Fast delivery"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <rect x="1" y="3" width="15" height="13" rx="2" />
                      <path d="M16 8h4l3 3v5h-7V8zM5.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM18.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z" />
                    </svg>
                  }
                />
                <TrustItem
                  label="WhatsApp support"
                  icon={
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  }
                />
              </div>

              {/* Bottom actions — one black, one outlined */}
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <a
                  href={`https://wa.me/2348000000000?text=${encodeURIComponent(
                    `Hi, I'm checking on my order ${order.order_id}.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                  style={{ backgroundColor: CHARCOAL, color: CREAM }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = TERRACOTTA)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = CHARCOAL)
                  }
                >
                  Message about this order
                </a>
                <Link
                  to="/my-orders"
                  className="inline-flex items-center gap-2 px-7 py-3.5 text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal transition-colors duration-300"
                  style={{ border: `1px solid ${CREAM_DARK}` }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.borderColor = CHARCOAL)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.borderColor = CREAM_DARK)
                  }
                >
                  View all my orders
                </Link>
              </div>

              <p
                className="mt-8 text-center text-[10.5px] font-bold uppercase tracking-[0.18em]"
                style={{ color: MUTED_SOFT }}
              >
                KOVA · Designed in Lagos
              </p>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function TrustItem({
  label,
  icon,
}: {
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <div>
      <div
        className="mx-auto flex h-8 w-8 items-center justify-center"
        style={{
          border: `1px solid ${CREAM_DARK}`,
          color: CHARCOAL,
        }}
      >
        {icon}
      </div>
      <p
        className="mt-2 text-[9px] font-bold uppercase tracking-[0.14em] text-charcoal sm:text-[9.5px]"
      >
        {label}
      </p>
    </div>
  );
}