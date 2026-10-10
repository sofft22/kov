import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../config';
import { updateOrderStatus } from '../../lib/store';

export interface Order {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  apartment: string | null;
  city: string;
  state: string;
  shipping_axis: string | null;
  shipping_price: number;
  items: any;
  subtotal: number;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  onOpenOrder: (o: Order) => void;
}

type StatusFilter = 'new' | 'processing' | 'delivered' | 'all';
type DateRange = 'all' | 'today' | '7d' | '30d';

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.55)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const PAID = '#226E3C';
const PENDING = '#A97814';
const PROCESSING = '#1E3C8C';

/* Payment status colors */
function payColor(status: string): string {
  return status === 'paid' ? PAID : PENDING;
}

/* Order status colors */
function orderStatusColor(status: string): string {
  if (status === 'delivered') return PAID;
  if (status === 'processing') return PROCESSING;
  return TERRACOTTA;
}

function orderStatusLabel(status: string): string {
  if (status === 'delivered') return 'Delivered';
  if (status === 'processing') return 'Processing';
  return 'New';
}

export function AdminOrders({ onOpenOrder }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<StatusFilter>('new');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    setOrders((data ?? []) as Order[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let list = [...orders];

    if (status !== 'all') list = list.filter((o) => o.status === status);

    if (dateRange !== 'all') {
      const days = dateRange === 'today' ? 0 : dateRange === '7d' ? 7 : 30;
      const cutoff = new Date();
      if (days === 0) cutoff.setHours(0, 0, 0, 0);
      else cutoff.setDate(cutoff.getDate() - days);
      const iso = cutoff.toISOString();
      list = list.filter((o) => o.created_at >= iso);
    }

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_id.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q) ||
          o.customer_phone.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, status, dateRange, query]);

  const counts = useMemo(
    () => ({
      new: orders.filter((o) => o.status === 'new').length,
      processing: orders.filter((o) => o.status === 'processing').length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      all: orders.length,
    }),
    [orders]
  );

  const revenue = useMemo(
    () =>
      orders
        .filter((o) => o.status === 'delivered')
        .reduce((s, o) => s + (o.total ?? 0), 0),
    [orders]
  );

  const tabs: { id: StatusFilter; label: string; count: number }[] = [
    { id: 'new', label: 'New', count: counts.new },
    { id: 'processing', label: 'Processing', count: counts.processing },
    { id: 'delivered', label: 'Delivered', count: counts.delivered },
    { id: 'all', label: 'All', count: counts.all },
  ];

  return (
    <div
      className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* ── Header ── */}
      <div className="mb-6">
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
          style={{ color: TERRACOTTA }}
        >
          Sales
        </p>
        <h1 className="mt-2 font-serif text-[26px] leading-none tracking-[-0.02em] text-charcoal sm:text-[30px]">
          Orders
        </h1>
        <p className="mt-3 text-[12.5px]" style={{ color: MUTED }}>
          {counts.all} total
          {counts.new > 0 && (
            <>
              {' · '}
              <span
                className="font-bold uppercase tracking-[0.06em]"
                style={{ color: TERRACOTTA }}
              >
                {counts.new} new
              </span>
            </>
          )}
          {revenue > 0 && (
            <>
              {' · '}
              <span className="font-numbers">
                {formatPrice(revenue)}
              </span>{' '}
              delivered
            </>
          )}
        </p>
      </div>

      {/* ── Filter bar ── */}
      <div
        className="mb-6"
        style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          {/* Tabs */}
          <nav className="no-scrollbar flex flex-1 items-center gap-x-6 overflow-x-auto sm:gap-x-8">
            {tabs.map((t) => {
              const active = status === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setStatus(t.id)}
                  className="relative shrink-0 pb-3 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-200"
                  style={{ color: active ? CHARCOAL : MUTED }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = CHARCOAL;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = MUTED;
                  }}
                >
                  {t.label}
                  <span
                    className="ml-2 font-numbers text-[10.5px]"
                    style={{
                      color: active ? TERRACOTTA : MUTED_SOFT,
                    }}
                  >
                    {t.count}
                  </span>
                  {active && (
                    <span
                      className="absolute -bottom-[13px] left-0 h-[2px] w-full"
                      style={{ backgroundColor: TERRACOTTA }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Search + Date range */}
          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <div className="relative w-full max-w-[220px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: MUTED_SOFT }}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full py-2 pl-9 pr-3 text-[12.5px] outline-none transition-colors"
                style={{
                  backgroundColor: CREAM,
                  border: `1px solid ${CREAM_DARK}`,
                  color: CHARCOAL,
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = TERRACOTTA)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = CREAM_DARK)
                }
              />
            </div>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="px-3 py-2 text-[12px] outline-none transition-colors"
              style={{
                backgroundColor: CREAM,
                border: `1px solid ${CREAM_DARK}`,
                color: CHARCOAL,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = TERRACOTTA)
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = CREAM_DARK)}
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div
            className="h-6 w-6 animate-spin rounded-full border-[2.5px]"
            style={{
              borderColor: CREAM_DARK,
              borderTopColor: TERRACOTTA,
            }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[13px] font-medium" style={{ color: MUTED }}>
            {orders.length === 0
              ? 'No orders yet.'
              : status === 'new'
              ? 'No new orders.'
              : 'No orders match.'}
          </p>
        </div>
      ) : (
        <ul>
          {filtered.map((o) => {
            const pColor = payColor(o.payment_status);
            const sColor = orderStatusColor(o.status);
            return (
              <li key={o.id}>
                <button
                  onClick={() => onOpenOrder(o)}
                  className="group flex w-full items-center gap-4 py-4 text-left transition-colors duration-200"
                  style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = 'rgba(26,26,26,0.02)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = 'transparent')
                  }
                >
                  {/* Order ID + date */}
                  <div className="w-[110px] flex-shrink-0">
                    <p className="font-numbers text-[13px] leading-none tracking-[0.02em] text-charcoal">
                      {o.order_id}
                    </p>
                    <p
                      className="mt-1.5 text-[11px]"
                      style={{ color: MUTED_SOFT }}
                    >
                      {new Date(o.created_at).toLocaleDateString('en-NG', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>

                  {/* Customer — desktop */}
                  <div className="hidden min-w-0 flex-1 sm:block">
                    <p className="truncate text-[12.5px] font-normal uppercase tracking-[0.06em] text-charcoal">
                      {o.customer_name}
                    </p>
                    <p
                      className="mt-0.5 truncate font-numbers text-[11.5px]"
                      style={{ color: MUTED_SOFT }}
                    >
                      {o.customer_phone}
                    </p>
                  </div>

                  {/* Customer — mobile */}
                  <div className="min-w-0 flex-1 sm:hidden">
                    <p className="truncate text-[12px] font-normal uppercase tracking-[0.06em] text-charcoal">
                      {o.customer_name}
                    </p>
                  </div>

                  {/* Payment status */}
                  <div className="hidden w-[90px] flex-shrink-0 md:block">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5"
                        style={{ backgroundColor: pColor }}
                      />
                      <span
                        className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: pColor }}
                      >
                        {o.payment_status === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </span>
                  </div>

                  {/* Order status */}
                  <div className="hidden w-[110px] flex-shrink-0 md:block">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-1.5 w-1.5"
                        style={{ backgroundColor: sColor }}
                      />
                      <span
                        className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
                        style={{ color: sColor }}
                      >
                        {orderStatusLabel(o.status)}
                      </span>
                    </span>
                  </div>

                  {/* Total */}
                  <div className="flex-shrink-0 text-right">
                    <p className="font-numbers text-[13.5px] text-charcoal">
                      {formatPrice(o.total)}
                    </p>
                  </div>

                  {/* Chevron */}
                  <div className="flex-shrink-0 pl-2">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5 transition-colors duration-200 group-hover:text-[#C66B4F]"
                      style={{ color: MUTED_SOFT }}
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}