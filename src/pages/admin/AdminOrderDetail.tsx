import { useState } from 'react';
import { formatPrice } from '../../config';
import { updateOrderStatus } from '../../lib/store';
import type { Order } from './AdminOrders';

interface Props {
  order: Order;
  onBack: () => void;
  onUpdated: () => void;
}

const STATUS_FLOW = ['new', 'processing', 'delivered'] as const;
type Status = typeof STATUS_FLOW[number];

const STATUS_LABEL: Record<Status, string> = {
  new: 'New',
  processing: 'Processing',
  delivered: 'Delivered',
};

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.55)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const PAID = '#226E3C';
const PENDING = '#A97814';

/* Status dot color — muted on-brand */
function statusDotColor(status: Status): string {
  switch (status) {
    case 'new':
      return TERRACOTTA;
    case 'processing':
      return '#1E3C8C';
    case 'delivered':
      return PAID;
    default:
      return MUTED;
  }
}

export function AdminOrderDetail({ order, onBack, onUpdated }: Props) {
  const [status, setStatus] = useState<Status>(
    (STATUS_FLOW.includes(order.status as Status) ? order.status : 'new') as Status
  );
  const [saving, setSaving] = useState(false);

  const items = Array.isArray(order.items) ? order.items : [];

  const fullAddress = `${order.address}${
    order.apartment ? ', ' + order.apartment : ''
  }, ${order.city}, ${order.state}`;

  const computedDiscount = Math.max(
    0,
    (order.subtotal ?? 0) + (order.shipping_price ?? 0) - (order.total ?? 0)
  );
  const hasDiscount = computedDiscount > 0;

  const setTo = async (next: Status) => {
    if (next === status || saving) return;
    setStatus(next);
    setSaving(true);
    await updateOrderStatus(order.id, next);
    setSaving(false);
    onUpdated();
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const openWhatsApp = () => {
    const msg = `Hi ${order.customer_name}, this is KOVA regarding your order ${order.order_id}.`;
    window.open(
      `https://wa.me/${order.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const currentIdx = STATUS_FLOW.indexOf(status);
  const nextStatus = STATUS_FLOW[currentIdx + 1] ?? null;
  const prevStatus = STATUS_FLOW[currentIdx - 1] ?? null;

  const isPaid = order.payment_status === 'paid';

  return (
    <div
      className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* ── Back ── */}
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
        style={{ color: MUTED }}
        onMouseEnter={(e) => (e.currentTarget.style.color = TERRACOTTA)}
        onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-3.5 w-3.5"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back to orders
      </button>

      {/* ── Header ── */}
      <div
        className="pb-6"
        style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
      >
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
          style={{ color: TERRACOTTA }}
        >
          Order
        </p>
        <p
          className="mt-3 text-[11.5px]"
          style={{ color: MUTED }}
        >
          {new Date(order.created_at).toLocaleString('en-NG', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </p>
        <h1 className="mt-2 font-numbers text-[26px] leading-tight tracking-[0.02em] text-charcoal sm:text-[32px]">
          {order.order_id}
        </h1>
      </div>

      {/* ── Two-column ── */}
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
        {/* ════ LEFT ════ */}
        <div className="space-y-8">
          {/* Customer */}
          <section
            className="pb-8"
            style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
          >
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
              style={{ color: MUTED_SOFT }}
            >
              Customer
            </p>
            <div className="mt-3 space-y-1.5">
              <p className="text-[14px] font-medium text-charcoal">
                {order.customer_name}
              </p>
              <p className="font-numbers text-[13px]" style={{ color: MUTED }}>
                {order.customer_phone}
              </p>
              {order.customer_email && (
                <p className="text-[13px]" style={{ color: MUTED }}>
                  {order.customer_email}
                </p>
              )}
            </div>

            <button
              onClick={openWhatsApp}
              className="mt-5 inline-flex items-center gap-2 px-4 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
              style={{ border: `1px solid ${CHARCOAL}`, color: CHARCOAL }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = CHARCOAL;
                e.currentTarget.style.color = CREAM;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = CHARCOAL;
              }}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
              </svg>
              Message {order.customer_name.split(' ')[0]}
            </button>
          </section>

          {/* Delivery */}
          <section
            className="pb-8"
            style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
          >
            <div className="flex items-center justify-between gap-3">
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
                style={{ color: MUTED_SOFT }}
              >
                Delivery
              </p>
              <button
                onClick={() => copy(fullAddress)}
                className="text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                style={{ color: MUTED }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = TERRACOTTA)
                }
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                Copy address
              </button>
            </div>
            <div className="mt-3 space-y-1.5">
              <p className="text-[14px] font-medium text-charcoal">
                {order.address}
                {order.apartment ? `, ${order.apartment}` : ''}
              </p>
              <p className="text-[13px]" style={{ color: MUTED }}>
                {order.city}, {order.state}
              </p>
            </div>
          </section>

          {/* Payment */}
          <section className="pb-2">
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
              style={{ color: MUTED_SOFT }}
            >
              Payment
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[13.5px] font-medium text-charcoal">
                {order.payment_method === 'paystack'
                  ? 'Card'
                  : order.payment_method === 'transfer'
                  ? 'Bank transfer'
                  : 'Pay on delivery'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="h-1.5 w-1.5"
                  style={{ backgroundColor: isPaid ? PAID : PENDING }}
                />
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: isPaid ? PAID : PENDING }}
                >
                  {isPaid ? 'Paid' : 'Pending'}
                </span>
              </span>
            </div>
          </section>
        </div>

        {/* ════ RIGHT ════ */}
        <div className="space-y-8">
          {/* Status */}
          <section
            className="pb-8"
            style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
          >
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
              style={{ color: MUTED_SOFT }}
            >
              Status
            </p>
            <div className="mt-3 flex items-center gap-2.5">
              <span
                className="h-2 w-2"
                style={{ backgroundColor: statusDotColor(status) }}
              />
              <span className="text-[13.5px] font-medium text-charcoal">
                {STATUS_LABEL[status]}
              </span>
              {saving && (
                <span
                  className="ml-1 text-[10.5px] uppercase tracking-[0.14em]"
                  style={{ color: MUTED_SOFT }}
                >
                  Saving…
                </span>
              )}
            </div>
          </section>

          {/* Items + Totals */}
          <section
            className="pb-8"
            style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
          >
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
              style={{ color: MUTED_SOFT }}
            >
              Items
            </p>

            <ul className="mt-4 space-y-4">
              {items.map((it: any, i: number) => (
                <li key={i} className="flex items-center gap-3">
                  {it.image_url && (
                    <div
                      className="h-11 w-11 flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: CREAM_DARK }}
                    >
                      <img
                        src={it.image_url}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11.5px] font-normal uppercase tracking-[0.08em] text-charcoal">
                      {it.name}
                    </p>
                    <p
                      className="mt-1 text-[11px]"
                      style={{ color: MUTED }}
                    >
                      Qty {it.qty}
                      {it.variant ? ` · ${it.variant}` : ''}
                    </p>
                  </div>
                  <p className="font-numbers flex-shrink-0 text-[12.5px] text-charcoal">
                    {formatPrice((it.price ?? 0) * (it.qty ?? 1))}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-[12.5px]">
                <span style={{ color: MUTED }}>Subtotal</span>
                <span className="font-numbers text-charcoal">
                  {formatPrice(order.subtotal)}
                </span>
              </div>
              {hasDiscount && (
                <div className="flex justify-between text-[12.5px]">
                  <span style={{ color: TERRACOTTA }}>Discount</span>
                  <span
                    className="font-numbers"
                    style={{ color: TERRACOTTA }}
                  >
                    -{formatPrice(computedDiscount)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[12.5px]">
                <span style={{ color: MUTED }}>Shipping</span>
                <span className="font-numbers text-charcoal">
                  {formatPrice(order.shipping_price)}
                </span>
              </div>
              <div
                className="mt-3 flex items-baseline justify-between pt-4"
                style={{ borderTop: `1px solid ${CREAM_DARK}` }}
              >
                <span
                  className="text-[10.5px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: CHARCOAL }}
                >
                  Total
                </span>
                <span className="font-numbers text-[20px] text-charcoal">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section>
            <p
              className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.24em]"
              style={{ color: MUTED_SOFT }}
            >
              Actions
            </p>

            {nextStatus && (
              <button
                onClick={() => setTo(nextStatus)}
                disabled={saving}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left text-[11.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 disabled:opacity-60"
                style={{ backgroundColor: CHARCOAL, color: CREAM }}
                onMouseEnter={(e) => {
                  if (!saving)
                    e.currentTarget.style.backgroundColor = TERRACOTTA;
                }}
                onMouseLeave={(e) => {
                  if (!saving)
                    e.currentTarget.style.backgroundColor = CHARCOAL;
                }}
              >
                <span>Mark as {STATUS_LABEL[nextStatus]}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  className="h-4 w-4"
                >
                  <path d="M5 12h14M13 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {!nextStatus && status === 'delivered' && (
              <div
                className="px-5 py-4 text-center text-[11.5px] font-bold uppercase tracking-[0.18em]"
                style={{
                  backgroundColor: `${PAID}1A`,
                  color: PAID,
                  border: `1px solid ${PAID}33`,
                }}
              >
                ✓ Order complete
              </div>
            )}

            {prevStatus && (
              <button
                onClick={() => setTo(prevStatus)}
                disabled={saving}
                className="mt-4 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                style={{ color: MUTED }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = TERRACOTTA)
                }
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                ← Back to {STATUS_LABEL[prevStatus]}
              </button>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}