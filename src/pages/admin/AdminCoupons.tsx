import { useEffect, useState } from 'react';
import {
  fetchAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  type Coupon,
  type CouponInput,
} from '../../lib/store';

type FormState = {
  code: string;
  type: 'percent' | 'fixed' | 'shipping';
  value: string;
  first_order_only: boolean;
  min_order: string;
  usage_limit: string;
  expires_at: string;
  active: boolean;
  featured: boolean;
  banner_text: string;
};

const EMPTY: FormState = {
  code: '',
  type: 'percent',
  value: '10',
  first_order_only: false,
  min_order: '0',
  usage_limit: '',
  expires_at: '',
  active: true,
  featured: false,
  banner_text: '',
};

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.55)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const ERROR = '#B42828';

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  fontSize: '13px',
  fontWeight: 500,
  backgroundColor: CREAM,
  border: `1px solid ${CREAM_DARK}`,
  color: CHARCOAL,
  outline: 'none',
  transition: 'border-color 0.2s',
};

export function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    const list = await fetchAllCoupons();
    setCoupons(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(EMPTY);
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  const startEdit = (c: Coupon) => {
    setForm({
      code: c.code.toUpperCase(),
      type: c.type,
      value: String(c.value),
      first_order_only: c.first_order_only,
      min_order: String(c.min_order),
      usage_limit: c.usage_limit === null ? '' : String(c.usage_limit),
      expires_at: c.expires_at ? c.expires_at.slice(0, 10) : '',
      active: c.active,
      featured: c.featured,
      banner_text: c.banner_text ?? '',
    });
    setEditingId(c.id);
    setShowForm(true);
  };

  const handleSave = async () => {
    setError('');
    if (!form.code.trim()) {
      setError('Code is required');
      return;
    }
    if (form.type !== 'shipping' && !form.value) {
      setError('Value is required');
      return;
    }

    setSaving(true);

    const payload: CouponInput = {
      code: form.code.trim().toLowerCase(),
      type: form.type,
      value: form.type === 'shipping' ? 0 : Number(form.value) || 0,
      first_order_only: form.first_order_only,
      min_order: Number(form.min_order) || 0,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null,
      active: form.active,
      featured: form.featured,
      banner_text: form.banner_text.trim() || null,
    };

    if (editingId) {
      const { error: err } = await updateCoupon(editingId, payload);
      setSaving(false);
      if (err) {
        setError(err);
        return;
      }
    } else {
      const { error: err } = await createCoupon(payload);
      setSaving(false);
      if (err) {
        setError(err);
        return;
      }
    }

    resetForm();
    await load();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this coupon?')) return;
    await deleteCoupon(id);
    await load();
  };

  const handleToggle = async (c: Coupon, field: 'active' | 'featured') => {
    await updateCoupon(c.id, { [field]: !c[field] });
    await load();
  };

  return (
    <div
      className="mx-auto max-w-5xl px-5 py-8 sm:px-8 sm:py-10"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* ── Header ── */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
            style={{ color: TERRACOTTA }}
          >
            Admin
          </p>
          <h1 className="mt-2 font-serif text-[26px] leading-none tracking-[-0.02em] text-charcoal sm:text-[30px]">
            Coupons
          </h1>
          <p className="mt-1.5 text-[12.5px]" style={{ color: MUTED }}>
            Create discount codes
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setForm(EMPTY);
              setEditingId(null);
              setShowForm(true);
            }}
            className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
            style={{ backgroundColor: CHARCOAL, color: CREAM }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = TERRACOTTA)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = CHARCOAL)
            }
          >
            + New
          </button>
        )}
      </div>

      {/* ── Form ── */}
      {showForm && (
        <div
          className="mb-6 p-6"
          style={{
            border: `1px solid ${CREAM_DARK}`,
            backgroundColor: CREAM,
          }}
        >
          <h2 className="mb-5 font-serif text-[18px] leading-none tracking-[-0.01em] text-charcoal">
            {editingId ? 'Edit coupon' : 'New coupon'}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Code">
              <input
                type="text"
                value={form.code}
                onChange={(e) =>
                  setForm({ ...form, code: e.target.value.toUpperCase() })
                }
                placeholder="WELCOME10"
                style={fieldStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = TERRACOTTA)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = CREAM_DARK)
                }
              />
            </Field>

            <Field label="Type">
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as any })
                }
                style={fieldStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = TERRACOTTA)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = CREAM_DARK)
                }
              >
                <option value="percent">Percent off (%)</option>
                <option value="fixed">Fixed amount off (₦)</option>
                <option value="shipping">Free shipping</option>
              </select>
            </Field>

            {form.type !== 'shipping' && (
              <Field label={`Value ${form.type === 'percent' ? '(%)' : '(₦)'}`}>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  style={fieldStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = TERRACOTTA)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = CREAM_DARK)
                  }
                />
              </Field>
            )}

            <Field label="Minimum order (₦)">
              <input
                type="number"
                value={form.min_order}
                onChange={(e) =>
                  setForm({ ...form, min_order: e.target.value })
                }
                style={fieldStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = TERRACOTTA)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = CREAM_DARK)
                }
              />
            </Field>

            <Field label="Max uses (empty = unlimited)">
              <input
                type="number"
                value={form.usage_limit}
                onChange={(e) =>
                  setForm({ ...form, usage_limit: e.target.value })
                }
                style={fieldStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = TERRACOTTA)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = CREAM_DARK)
                }
              />
            </Field>

            <Field label="Expires (optional)">
              <input
                type="date"
                value={form.expires_at}
                onChange={(e) =>
                  setForm({ ...form, expires_at: e.target.value })
                }
                style={fieldStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = TERRACOTTA)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = CREAM_DARK)
                }
              />
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Banner text (optional)">
              <input
                type="text"
                value={form.banner_text}
                onChange={(e) =>
                  setForm({ ...form, banner_text: e.target.value })
                }
                placeholder="e.g. Eid sale — 15% off everything"
                style={fieldStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = TERRACOTTA)
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = CREAM_DARK)
                }
              />
            </Field>
          </div>

          <div className="mt-5 flex flex-wrap gap-5">
            <Toggle
              label="First order only"
              checked={form.first_order_only}
              onChange={(v) => setForm({ ...form, first_order_only: v })}
            />
            <Toggle
              label="Active"
              checked={form.active}
              onChange={(v) => setForm({ ...form, active: v })}
            />
            <Toggle
              label="Featured (home banner)"
              checked={form.featured}
              onChange={(v) => setForm({ ...form, featured: v })}
            />
          </div>

          {error && (
            <p
              className="mt-4 px-4 py-2.5 text-[12.5px] font-medium"
              style={{
                backgroundColor: '#FBEDED',
                color: ERROR,
                border: `1px solid ${ERROR}33`,
              }}
            >
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 disabled:opacity-50"
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
              {saving ? 'Saving…' : editingId ? 'Update' : 'Create'}
            </button>
            <button
              onClick={resetForm}
              className="px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal transition-colors duration-300"
              style={{ border: `1px solid ${CREAM_DARK}` }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = CHARCOAL)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = CREAM_DARK)
              }
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── List ── */}
      {loading ? (
        <div className="py-20 text-center">
          <div
            className="mx-auto h-6 w-6 animate-spin rounded-full border-[2.5px]"
            style={{
              borderColor: CREAM_DARK,
              borderTopColor: TERRACOTTA,
            }}
          />
        </div>
      ) : coupons.length === 0 ? (
        <div
          className="py-16 text-center"
          style={{
            border: `1px solid ${CREAM_DARK}`,
            backgroundColor: CREAM,
          }}
        >
          <p className="text-[13px] font-medium text-charcoal">
            No coupons yet
          </p>
          <p className="mt-1.5 text-[12px]" style={{ color: MUTED }}>
            Create one to start running promos
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {coupons.map((c) => (
            <li
              key={c.id}
              className="p-5"
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-numbers text-[15px] leading-none tracking-[0.04em] text-charcoal">
                      {c.code.toUpperCase()}
                    </p>
                    {c.featured && (
                      <span
                        className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em]"
                        style={{
                          backgroundColor: `${TERRACOTTA}1A`,
                          color: TERRACOTTA,
                        }}
                      >
                        Featured
                      </span>
                    )}
                    {!c.active && (
                      <span
                        className="px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.16em]"
                        style={{
                          backgroundColor: 'rgba(26,26,26,0.06)',
                          color: MUTED,
                        }}
                      >
                        Inactive
                      </span>
                    )}
                  </div>

                  {c.banner_text && (
                    <p
                      className="mt-2 text-[12.5px] italic"
                      style={{ color: MUTED }}
                    >
                      "{c.banner_text}"
                    </p>
                  )}

                  <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
                    {c.type === 'percent'
                      ? `${c.value}% off`
                      : c.type === 'fixed'
                      ? `₦${c.value.toLocaleString('en-NG')} off`
                      : 'Free shipping'}
                    {c.min_order > 0 &&
                      ` · min ₦${c.min_order.toLocaleString('en-NG')}`}
                    {c.first_order_only && ` · first order only`}
                    {c.usage_limit !== null &&
                      ` · ${c.uses}/${c.usage_limit} used`}
                    {c.usage_limit === null &&
                      c.uses > 0 &&
                      ` · ${c.uses} used`}
                    {c.expires_at &&
                      ` · expires ${new Date(c.expires_at).toLocaleDateString(
                        'en-NG'
                      )}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <ActionButton onClick={() => handleToggle(c, 'active')}>
                    {c.active ? 'Off' : 'On'}
                  </ActionButton>
                  <ActionButton onClick={() => handleToggle(c, 'featured')}>
                    {c.featured ? 'Unfeature' : 'Feature'}
                  </ActionButton>
                  <ActionButton onClick={() => startEdit(c)}>
                    Edit
                  </ActionButton>
                  <ActionButton
                    onClick={() => handleDelete(c.id)}
                    danger
                  >
                    Delete
                  </ActionButton>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FIELD
   ───────────────────────────────────────────── */
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[0.16em]"
        style={{ color: MUTED }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

/* ─────────────────────────────────────────────
   TOGGLE — square, on-brand
   ───────────────────────────────────────────── */
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <span
        className="relative h-5 w-9 flex-shrink-0 transition-colors duration-300"
        style={{
          backgroundColor: checked ? CHARCOAL : 'rgba(26,26,26,0.15)',
        }}
      >
        <span
          className="absolute top-0.5 h-4 w-4 bg-white shadow-sm transition-transform duration-300"
          style={{
            transform: checked
              ? 'translateX(18px)'
              : 'translateX(2px)',
          }}
        />
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-[13px] text-charcoal">{label}</span>
    </label>
  );
}

/* ─────────────────────────────────────────────
   ACTION BUTTON — small, square, outlined
   ───────────────────────────────────────────── */
function ActionButton({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
      style={{
        border: `1px solid ${CREAM_DARK}`,
        color: danger ? ERROR : CHARCOAL,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = danger ? ERROR : CHARCOAL;
        e.currentTarget.style.backgroundColor = danger
          ? '#FBEDED'
          : CHARCOAL;
        e.currentTarget.style.color = danger ? ERROR : CREAM;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = CREAM_DARK;
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = danger ? ERROR : CHARCOAL;
      }}
    >
      {children}
    </button>
  );
}