import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../config';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type Range = '7d' | '30d' | '90d';

interface StatBlock {
  rangeOrders: number;
  rangeRevenue: number;
  prevRangeRevenue: number;
  pendingOrders: number;
  pendingReviews: number;
  outOfStock: number;
  todayOrders: number;
  todayRevenue: number;
}

interface RecentOrder {
  id: string;
  order_id: string;
  customer_name: string;
  total: number;
  status: string;
  payment_status: string;
  items: any;
  created_at: string;
}

interface RevenuePoint {
  date: string;
  revenue: number;
}

interface TopProduct {
  product_id: string;
  name: string;
  image_url: string | null;
  price: number;
  adds: number;
}

interface Props {
  onGoToOrders: () => void;
  onGoToProducts?: () => void;
  onGoToReviews?: () => void;
}

const RANGE_DAYS: Record<Range, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.5)';
const MUTED_SOFT = 'rgba(26,26,26,0.35)';
const GREEN = '#226E3C';
const AMBER = '#A97814';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function AdminDashboard({
  onGoToOrders,
  onGoToProducts,
  onGoToReviews,
}: Props) {
  const [stats, setStats] = useState<StatBlock | null>(null);
  const [recent, setRecent] = useState<RecentOrder[]>([]);
  const [revenue, setRevenue] = useState<RevenuePoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [range, setRange] = useState<Range>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const days = RANGE_DAYS[range];
      const rangeStart = new Date(
        Date.now() - days * 24 * 60 * 60 * 1000
      ).toISOString();
      const prevStart = new Date(
        Date.now() - days * 2 * 24 * 60 * 60 * 1000
      ).toISOString();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const [
        rangeOrdersRes,
        rangeRevenueRes,
        prevRevenueRes,
        pendingOrdersRes,
        pendingReviewsRes,
        outOfStockRes,
        recentRes,
        allOrdersRes,
        todayOrdersRes,
        todayRevenueRes,
        cartAddsRes,
        productsRes,
      ] = await Promise.all([
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', rangeStart),
        supabase.from('orders').select('total').gte('created_at', rangeStart),
        supabase
          .from('orders')
          .select('total')
          .gte('created_at', prevStart)
          .lt('created_at', rangeStart),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'new'),
        supabase
          .from('reviews')
          .select('*', { count: 'exact', head: true })
          .eq('approved', false),
        supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('in_stock', false),
        supabase
          .from('orders')
          .select(
            'id, order_id, customer_name, total, status, payment_status, items, created_at'
          )
          .order('created_at', { ascending: false })
          .limit(6),
        supabase
          .from('orders')
          .select('total, created_at')
          .order('created_at', { ascending: false })
          .limit(500),
        supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', todayIso),
        supabase.from('orders').select('total').gte('created_at', todayIso),
        supabase
          .from('cart_adds_log')
          .select('product_id')
          .gte('created_at', rangeStart),
        supabase.from('products').select('id, name, image_url, price'),
      ]);

      const sumRange = (rangeRevenueRes.data ?? []).reduce(
        (s, r: any) => s + (r.total ?? 0),
        0
      );
      const sumPrev = (prevRevenueRes.data ?? []).reduce(
        (s, r: any) => s + (r.total ?? 0),
        0
      );
      const sumToday = (todayRevenueRes.data ?? []).reduce(
        (s, r: any) => s + (r.total ?? 0),
        0
      );

      setStats({
        rangeOrders: rangeOrdersRes.count ?? 0,
        rangeRevenue: sumRange,
        prevRangeRevenue: sumPrev,
        pendingOrders: pendingOrdersRes.count ?? 0,
        pendingReviews: pendingReviewsRes.count ?? 0,
        outOfStock: outOfStockRes.count ?? 0,
        todayOrders: todayOrdersRes.count ?? 0,
        todayRevenue: sumToday,
      });
      setRecent((recentRes.data ?? []) as RecentOrder[]);

      const orders = (allOrdersRes.data ?? []) as any[];
      const byDay: Record<string, number> = {};
      orders.forEach((o) => {
        const day = new Date(o.created_at).toISOString().slice(0, 10);
        byDay[day] = (byDay[day] ?? 0) + (o.total ?? 0);
      });

      const rev: RevenuePoint[] = [];
      for (let i = 89; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        rev.push({ date: key, revenue: byDay[key] ?? 0 });
      }
      setRevenue(rev);

      const productMap: Record<string, any> = {};
      (productsRes.data ?? []).forEach((p: any) => {
        productMap[p.id] = p;
      });

      const addCounts: Record<string, number> = {};
      (cartAddsRes.data ?? []).forEach((row: any) => {
        addCounts[row.product_id] = (addCounts[row.product_id] ?? 0) + 1;
      });

      const sorted: TopProduct[] = Object.entries(addCounts)
        .map(([id, adds]) => {
          const prod = productMap[id];
          if (!prod) return null;
          return {
            product_id: id,
            name: prod.name,
            image_url: prod.image_url,
            price: prod.price,
            adds,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b!.adds - a!.adds)
        .slice(0, 3) as TopProduct[];

      setTopProducts(sorted);
      setLoading(false);
    };
    load();
  }, [range]);

  const chartDays = RANGE_DAYS[range];
  const visibleRevenue = useMemo(
    () => revenue.slice(-Math.max(chartDays, 7)),
    [revenue, chartDays]
  );

  const rangeLabel =
    range === '7d'
      ? 'Last 7 days'
      : range === '30d'
      ? 'Last 30 days'
      : 'Last 90 days';

  const delta =
    stats && stats.prevRangeRevenue > 0
      ? Math.round(
          ((stats.rangeRevenue - stats.prevRangeRevenue) /
            stats.prevRangeRevenue) *
            100
        )
      : null;
  const up = delta !== null && delta >= 0;

  if (loading) {
    return (
      <div
        className="flex justify-center py-32"
        style={{ backgroundColor: CREAM }}
      >
        <div
          className="h-7 w-7 animate-spin rounded-full border-[2.5px]"
          style={{
            borderColor: CREAM_DARK,
            borderTopColor: TERRACOTTA,
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-6 py-10 sm:px-10 sm:py-12 lg:px-12"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      <div className="mx-auto max-w-6xl">
        {/* ═════════ HEADER ═════════ */}
        <div
          className="mb-10 flex flex-wrap items-end justify-between gap-6 pb-8"
          style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
        >
          <div>
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.3em]"
              style={{ color: TERRACOTTA }}
            >
              {greeting()}
            </p>
            <h1 className="mt-3 font-serif text-[32px] leading-none tracking-[-0.03em] text-charcoal sm:text-[42px]">
              Dashboard
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
            <div className="flex items-baseline gap-3">
              <span
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: MUTED_SOFT }}
              >
                Today
              </span>
              <span className="font-numbers text-[15px] text-charcoal">
                {stats?.todayOrders ?? 0}
              </span>
              <span
                className="text-[10px] font-bold uppercase tracking-[0.22em]"
                style={{ color: MUTED_SOFT }}
              >
                orders
              </span>
              <span className="text-[10px]" style={{ color: MUTED_SOFT }}>
                ·
              </span>
              <span className="font-numbers text-[15px] text-charcoal">
                {formatPrice(stats?.todayRevenue ?? 0)}
              </span>
            </div>

            <div className="flex" style={{ border: `1px solid ${CREAM_DARK}` }}>
              {(['7d', '30d', '90d'] as Range[]).map((r) => {
                const active = range === r;
                return (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className="px-4 py-2 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-200"
                    style={{
                      backgroundColor: active ? CHARCOAL : 'transparent',
                      color: active ? CREAM : MUTED,
                      borderRight:
                        r !== '90d' ? `1px solid ${CREAM_DARK}` : 'none',
                    }}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ═════════ MAIN GRID ═════════ */}
        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* ── REVENUE CARD — reduced, no sparkline ── */}
          <div
            className="relative overflow-hidden p-7 lg:col-span-2"
            style={{ backgroundColor: CHARCOAL, color: CREAM }}
          >
            <div
              className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full blur-3xl"
              style={{ backgroundColor: `${TERRACOTTA}1F` }}
            />

            <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <div className="min-w-0">
                <p
                  className="text-[10px] font-bold uppercase tracking-[0.26em]"
                  style={{ color: 'rgba(251,249,245,0.55)' }}
                >
                  Revenue · {rangeLabel}
                </p>
                <p className="mt-3 font-numbers text-[38px] leading-none tracking-[-0.02em] sm:text-[46px]">
                  {formatPrice(stats?.rangeRevenue ?? 0)}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {delta !== null && (
                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                    style={{
                      backgroundColor: up
                        ? `${TERRACOTTA}55`
                        : 'rgba(0,0,0,0.35)',
                      color: CREAM,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      className={`h-2.5 w-2.5 ${up ? '' : 'rotate-180'}`}
                    >
                      <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                    {Math.abs(delta)}%
                  </span>
                )}
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: 'rgba(251,249,245,0.6)' }}
                >
                  {stats?.rangeOrders ?? 0} orders
                </span>
              </div>
            </div>
          </div>

          {/* ── ATTENTION STACK ── */}
          <div className="flex flex-col gap-3">
            <AttentionBlock
              label="Pending orders"
              value={stats?.pendingOrders ?? 0}
              onClick={onGoToOrders}
            />
            <AttentionBlock
              label="Pending reviews"
              value={stats?.pendingReviews ?? 0}
              onClick={onGoToReviews}
            />
            <AttentionBlock
              label="Out of stock"
              value={stats?.outOfStock ?? 0}
              onClick={onGoToProducts}
            />
          </div>
        </div>

        {/* ═════════ TOP SELLING ═════════ */}
        {topProducts.length > 0 && (
          <div
            className="mb-6 p-6 sm:p-7"
            style={{
              border: `1px solid ${CREAM_DARK}`,
              backgroundColor: CREAM,
            }}
          >
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.26em]"
                  style={{ color: TERRACOTTA }}
                >
                  Top selling
                </p>
                <h2 className="mt-2 font-serif text-[20px] leading-none tracking-[-0.02em] text-charcoal sm:text-[24px]">
                  Added to bag most · {rangeLabel.toLowerCase()}
                </h2>
              </div>
              {onGoToProducts && (
                <button
                  onClick={onGoToProducts}
                  className="text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                  style={{ color: CHARCOAL }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = TERRACOTTA)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = CHARCOAL)
                  }
                >
                  Manage →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {topProducts.map((tp, i) => (
                <div
                  key={tp.product_id}
                  className="flex items-center gap-4 p-4"
                  style={{
                    border: `1px solid ${CREAM_DARK}`,
                    backgroundColor: CREAM,
                  }}
                >
                  <span
                    className="font-numbers text-[28px] leading-none"
                    style={{ color: `${TERRACOTTA}55` }}
                  >
                    {i + 1}
                  </span>
                  <div
                    className="h-14 w-14 flex-shrink-0 overflow-hidden"
                    style={{ backgroundColor: CREAM_DARK }}
                  >
                    {tp.image_url && (
                      <img
                        src={tp.image_url}
                        alt={tp.name}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-normal uppercase tracking-[0.06em] text-charcoal">
                      {tp.name}
                    </p>
                    <p
                      className="mt-1 font-numbers text-[11.5px]"
                      style={{ color: MUTED }}
                    >
                      {formatPrice(tp.price)}
                    </p>
                    <p
                      className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em]"
                      style={{ color: TERRACOTTA }}
                    >
                      {tp.adds} add{tp.adds === 1 ? '' : 's'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════ CHART ═════════ */}
        <div
          className="mb-6 p-7 sm:p-8"
          style={{
            border: `1px solid ${CREAM_DARK}`,
            backgroundColor: CREAM,
          }}
        >
          <div className="mb-7 flex items-end justify-between gap-3">
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.26em]"
                style={{ color: TERRACOTTA }}
              >
                Performance
              </p>
              <h2 className="mt-2 font-serif text-[22px] leading-none tracking-[-0.02em] text-charcoal sm:text-[26px]">
                Sales revenue
              </h2>
            </div>
            <p
              className="text-[10.5px] font-bold uppercase tracking-[0.2em]"
              style={{ color: MUTED_SOFT }}
            >
              {rangeLabel}
            </p>
          </div>

          <div className="h-[300px] w-full sm:h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={visibleRevenue}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10.5, fill: 'rgba(26,26,26,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => {
                    const d = new Date(v);
                    return `${d.getDate()}/${d.getMonth() + 1}`;
                  }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  tick={{ fontSize: 10.5, fill: 'rgba(26,26,26,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                  }
                  width={48}
                />
                <Tooltip
                  contentStyle={{
                    background: CHARCOAL,
                    border: 'none',
                    borderRadius: '2px',
                    color: CREAM,
                    fontSize: '12px',
                    padding: '10px 14px',
                    boxShadow: '0 8px 24px -8px rgba(26,26,26,0.4)',
                  }}
                  labelStyle={{
                    color: 'rgba(251,249,245,0.55)',
                    fontSize: '10.5px',
                    marginBottom: '4px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                  formatter={(value: any) => [formatPrice(value), 'Revenue']}
                  labelFormatter={(label: any) => {
                    const d = new Date(label);
                    return d.toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                    });
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={TERRACOTTA}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{
                    r: 5,
                    fill: TERRACOTTA,
                    stroke: CREAM,
                    strokeWidth: 2,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ═════════ RECENT ORDERS ═════════ */}
        <div
          style={{
            border: `1px solid ${CREAM_DARK}`,
            backgroundColor: CREAM,
          }}
        >
          <div
            className="flex items-end justify-between gap-3 px-7 pt-7 pb-5"
            style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
          >
            <div>
              <p
                className="text-[10.5px] font-bold uppercase tracking-[0.26em]"
                style={{ color: TERRACOTTA }}
              >
                Latest
              </p>
              <h2 className="mt-2 font-serif text-[22px] leading-none tracking-[-0.02em] text-charcoal sm:text-[26px]">
                Recent orders
              </h2>
            </div>
            <button
              onClick={onGoToOrders}
              className="text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
              style={{ color: CHARCOAL }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = TERRACOTTA)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = CHARCOAL)
              }
            >
              View all →
            </button>
          </div>

          {recent.length === 0 ? (
            <div className="py-16 text-center">
              <p className="font-serif text-[18px] leading-tight text-charcoal">
                No orders yet.
              </p>
              <p className="mt-2 text-[12.5px]" style={{ color: MUTED }}>
                Your first sale will show up here.
              </p>
            </div>
          ) : (
            <ul>
              {recent.map((o) => {
                const itemCount = Array.isArray(o.items)
                  ? o.items.reduce(
                      (sum: number, it: any) => sum + (it?.qty ?? 1),
                      0
                    )
                  : 0;
                const dt = new Date(o.created_at);
                const time = dt.toLocaleTimeString('en-NG', {
                  hour: 'numeric',
                  minute: '2-digit',
                });
                const date = dt.toLocaleDateString('en-NG', {
                  day: 'numeric',
                  month: 'short',
                });
                const isPaid = o.payment_status === 'paid';

                return (
                  <li key={o.id}>
                    <button
                      onClick={onGoToOrders}
                      className="group flex w-full items-center gap-4 px-7 py-5 text-left transition-colors duration-200"
                      style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = CREAM_DARK)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                          <p className="font-numbers text-[13.5px] leading-none tracking-[0.02em] text-charcoal">
                            {o.order_id}
                          </p>
                          <p
                            className="truncate text-[11px] uppercase tracking-[0.06em]"
                            style={{ color: MUTED_SOFT }}
                          >
                            {o.customer_name}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span
                            className="text-[11px]"
                            style={{ color: MUTED }}
                          >
                            {date} · {time}
                          </span>
                          {itemCount > 0 && (
                            <>
                              <span
                                className="text-[10px]"
                                style={{ color: MUTED_SOFT }}
                              >
                                ·
                              </span>
                              <span
                                className="text-[10.5px] font-bold uppercase tracking-[0.14em]"
                                style={{ color: MUTED }}
                              >
                                {itemCount}{' '}
                                {itemCount === 1 ? 'item' : 'items'}
                              </span>
                            </>
                          )}
                          <span
                            className="text-[10px]"
                            style={{ color: MUTED_SOFT }}
                          >
                            ·
                          </span>
                          <span
                            className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em]"
                            style={{ color: isPaid ? GREEN : AMBER }}
                          >
                            <span
                              className="h-1.5 w-1.5"
                              style={{
                                backgroundColor: isPaid ? GREEN : AMBER,
                              }}
                            />
                            {isPaid ? 'Paid' : 'Pending'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-shrink-0 items-center gap-4">
                        <span className="font-numbers text-[14px] text-charcoal">
                          {formatPrice(o.total)}
                        </span>
                        <span
                          className="px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em]"
                          style={statusStyle(o.status)}
                        >
                          {o.status}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   ATTENTION BLOCK
   ───────────────────────────────────────────── */
function AttentionBlock({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  const active = value > 0;

  const style: React.CSSProperties = active
    ? {
        border: `1px solid ${TERRACOTTA}55`,
        backgroundColor: `${TERRACOTTA}0F`,
      }
    : {
        border: `1px solid ${CREAM_DARK}`,
        backgroundColor: CREAM,
      };

  const inner = (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p
          className="text-[10px] font-bold uppercase tracking-[0.22em]"
          style={{ color: active ? TERRACOTTA : MUTED }}
        >
          {label}
        </p>
        <p
          className="mt-2 font-numbers text-[28px] leading-none tracking-tight"
          style={{
            color: active ? TERRACOTTA : 'rgba(26,26,26,0.18)',
          }}
        >
          {value}
        </p>
      </div>
      {active && (
        <span
          className="text-[14px] transition-colors duration-200"
          style={{ color: TERRACOTTA }}
        >
          →
        </span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className="flex-1 px-5 py-4 text-left transition-colors duration-300"
        style={style}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.borderColor = `${TERRACOTTA}55`;
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.borderColor = CREAM_DARK;
        }}
      >
        {inner}
      </button>
    );
  }
  return (
    <div className="flex-1 px-5 py-4" style={style}>
      {inner}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATUS COLORS
   ───────────────────────────────────────────── */
function statusStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'new':
      return {
        backgroundColor: `${TERRACOTTA}1A`,
        color: TERRACOTTA,
      };
    case 'delivered':
      return {
        backgroundColor: 'rgba(34,110,60,0.1)',
        color: GREEN,
      };
    case 'cancelled':
      return {
        backgroundColor: 'rgba(180,40,40,0.1)',
        color: '#B42828',
      };
    case 'paid':
      return {
        backgroundColor: 'rgba(30,60,140,0.1)',
        color: '#1E3C8C',
      };
    case 'packed':
      return {
        backgroundColor: 'rgba(170,120,20,0.1)',
        color: AMBER,
      };
    case 'shipped':
      return {
        backgroundColor: 'rgba(70,50,140,0.1)',
        color: '#46328C',
      };
    default:
      return {
        backgroundColor: 'rgba(26,26,26,0.06)',
        color: 'rgba(26,26,26,0.65)',
      };
  }
}