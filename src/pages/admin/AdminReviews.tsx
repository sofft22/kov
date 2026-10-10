import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

type Filter = 'pending' | 'approved' | 'all';

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.55)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const APPROVED = '#226E3C';
const PENDING = '#A97814';

export function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [reviewsRes, productsRes] = await Promise.all([
      supabase.from('reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name'),
    ]);
    setReviews((reviewsRes.data ?? []) as Review[]);
    const map: Record<string, string> = {};
    (productsRes.data ?? []).forEach((p: any) => {
      map[p.id] = p.name;
    });
    setProducts(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    if (filter === 'pending') return reviews.filter((r) => !r.approved);
    if (filter === 'approved') return reviews.filter((r) => r.approved);
    return reviews;
  }, [reviews, filter]);

  const setApproved = async (ids: string[], approved: boolean) => {
    if (ids.length === 0) return;
    setBusy(true);
    await supabase.from('reviews').update({ approved }).in('id', ids);
    setBusy(false);
    await load();
  };

  const handleDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} review${ids.length > 1 ? 's' : ''}?`)) return;
    setBusy(true);
    await supabase.from('reviews').delete().in('id', ids);
    setBusy(false);
    await load();
  };

  const pendingCount = reviews.filter((r) => !r.approved).length;
  const approvedCount = reviews.length - pendingCount;

  return (
    <div
      className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* ── Header ── */}
      <div className="mb-8">
        <p
          className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
          style={{ color: TERRACOTTA }}
        >
          Community
        </p>
        <h1 className="mt-2 font-serif text-[26px] leading-none tracking-[-0.02em] text-charcoal sm:text-[30px]">
          Reviews
        </h1>
        <p className="mt-3 text-[12.5px]" style={{ color: MUTED }}>
          {reviews.length} total · {approvedCount} approved
        </p>
      </div>

      {/* ── Filter tabs ── */}
      <div className="mb-8 flex items-center gap-6 sm:gap-8">
        {(['pending', 'approved', 'all'] as Filter[]).map((f) => {
          const active = filter === f;
          const count =
            f === 'pending'
              ? pendingCount
              : f === 'approved'
              ? approvedCount
              : reviews.length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="flex items-baseline gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-200"
              style={{ color: active ? CHARCOAL : MUTED }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.color = CHARCOAL;
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.color = MUTED;
              }}
            >
              <span>{f}</span>
              <span
                className="font-numbers text-[10.5px]"
                style={{ color: active ? TERRACOTTA : MUTED_SOFT }}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div
            className="h-6 w-6 animate-spin rounded-full border-[2.5px]"
            style={{
              borderColor: CREAM_DARK,
              borderTopColor: TERRACOTTA,
            }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <p
          className="py-20 text-center text-[13px] font-medium"
          style={{ color: MUTED }}
        >
          {filter === 'pending' ? 'No reviews waiting.' : 'No reviews yet.'}
        </p>
      ) : (
        <>
          {/* ════ DESKTOP — table ════ */}
          <div className="hidden lg:block">
            <div
              className="flex items-center gap-6 py-3 text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{
                borderBottom: `1px solid ${CREAM_DARK}`,
                color: MUTED_SOFT,
              }}
            >
              <div className="w-[160px]">Customer</div>
              <div className="w-[180px]">Product</div>
              <div className="w-[130px]">Rating</div>
              <div className="min-w-0 flex-1">Comment</div>
              <div className="w-[130px]">Status</div>
              <div className="w-[70px]">Date</div>
              <div className="w-[110px] text-right"></div>
            </div>

            {filtered.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-6 py-5 transition-colors duration-200"
                style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = 'rgba(26,26,26,0.02)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <div className="w-[160px] min-w-0">
                  <p className="truncate text-[12.5px] font-normal uppercase tracking-[0.06em] text-charcoal">
                    {r.customer_name}
                  </p>
                </div>

                <div className="w-[180px] min-w-0">
                  <p className="truncate text-[12px]" style={{ color: MUTED }}>
                    {products[r.product_id] ?? 'Unknown'}
                  </p>
                </div>

                <div className="w-[130px]">
                  <span
                    className="text-[12px] tracking-[0.1em]"
                    style={{ color: TERRACOTTA }}
                  >
                    {'★'.repeat(r.rating)}
                    <span style={{ color: MUTED_SOFT }}>
                      {'★'.repeat(5 - r.rating)}
                    </span>
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="truncate text-[12.5px]"
                    style={{ color: 'rgba(26,26,26,0.7)' }}
                  >
                    "{r.comment}"
                  </p>
                </div>

                <div className="w-[130px]">
                  {r.approved ? (
                    <StatusChip label="Approved" color={APPROVED} />
                  ) : (
                    <StatusChip label="Pending" color={PENDING} />
                  )}
                </div>

                <div
                  className="w-[70px] font-numbers text-[11.5px]"
                  style={{ color: MUTED_SOFT }}
                >
                  {new Date(r.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>

                <div className="flex w-[110px] flex-col items-end gap-1.5">
                  <RowAction
                    onClick={() => setApproved([r.id], !r.approved)}
                    disabled={busy}
                  >
                    {r.approved ? 'Unapprove' : 'Approve'}
                  </RowAction>
                  <RowAction
                    onClick={() => handleDelete([r.id])}
                    disabled={busy}
                    danger
                  >
                    Delete
                  </RowAction>
                </div>
              </div>
            ))}
          </div>

          {/* ════ MOBILE ════ */}
          <div className="lg:hidden">
            {filtered.map((r) => (
              <div
                key={r.id}
                className="py-5"
                style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
              >
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <p className="text-[12.5px] font-normal uppercase tracking-[0.06em] text-charcoal">
                    {r.customer_name}
                  </p>
                  <span
                    className="text-[12px] tracking-[0.1em]"
                    style={{ color: TERRACOTTA }}
                  >
                    {'★'.repeat(r.rating)}
                    <span style={{ color: MUTED_SOFT }}>
                      {'★'.repeat(5 - r.rating)}
                    </span>
                  </span>
                </div>

                <p
                  className="mt-1.5 text-[11px]"
                  style={{ color: MUTED }}
                >
                  on{' '}
                  <span style={{ color: TERRACOTTA }}>
                    {products[r.product_id] ?? 'Unknown'}
                  </span>
                  {' · '}
                  {new Date(r.created_at).toLocaleDateString('en-NG', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>

                <p
                  className="mt-3 text-[13px] leading-[1.6]"
                  style={{ color: 'rgba(26,26,26,0.85)' }}
                >
                  "{r.comment}"
                </p>

                <div className="mt-4 flex items-center gap-4">
                  <RowAction
                    onClick={() => setApproved([r.id], !r.approved)}
                    disabled={busy}
                  >
                    {r.approved ? 'Unapprove' : 'Approve'}
                  </RowAction>
                  <RowAction
                    onClick={() => handleDelete([r.id])}
                    disabled={busy}
                    danger
                  >
                    Delete
                  </RowAction>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATUS CHIP — square, tinted
   ───────────────────────────────────────────── */
function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.16em]"
      style={{
        backgroundColor: `${color}1A`,
        color,
      }}
    >
      {label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   ROW ACTION — small text link, hover → underline
   ───────────────────────────────────────────── */
function RowAction({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  const color = danger ? '#B42828' : CHARCOAL;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="text-[10px] font-bold uppercase tracking-[0.16em] underline-offset-4 transition-colors duration-200 disabled:opacity-50"
      style={{ color: danger ? color : MUTED }}
      onMouseEnter={(e) => {
        if (disabled) return;
        e.currentTarget.style.color = danger ? color : TERRACOTTA;
        e.currentTarget.style.textDecoration = 'underline';
      }}
      onMouseLeave={(e) => {
        if (disabled) return;
        e.currentTarget.style.color = danger ? color : MUTED;
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      {children}
    </button>
  );
}