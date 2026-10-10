import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { BRAND, BANK } from '../../config';
import { NIGERIAN_STATES } from '../../lib/data';

interface ShippingZone {
  id: string;
  name: string;
  price: number;
  states: string[];
}

interface Settings {
  whatsapp_number: string;
  email: string;
  instagram: string;
  tiktok: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  payment_paystack_enabled: boolean;
  payment_transfer_enabled: boolean;
  payment_delivery_enabled: boolean;
  store_open: boolean;
  closed_message: string;
  lagos_axes: { id: string; label: string; price: number }[];
  shipping_zones: ShippingZone[];
}

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.55)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const OPEN_GREEN = '#226E3C';
const CLOSED_RED = '#B42828';
const WARN = '#A97814';

const DEFAULT_SETTINGS: Settings = {
  whatsapp_number: BRAND.whatsappNumber,
  email: BRAND.email,
  instagram: BRAND.instagram,
  tiktok: BRAND.tiktok,
  bank_name: BANK.name,
  bank_account_name: BANK.accountName,
  bank_account_number: BANK.accountNumber,
  payment_paystack_enabled: true,
  payment_transfer_enabled: true,
  payment_delivery_enabled: true,
  store_open: true,
  closed_message: 'We’re closed for now. Back soon.',
  lagos_axes: [
    { id: 'axis-1', label: 'Axis 1: Lekki phase 1, Freedom Way, Itedo, Ikate, Ikoyi', price: 2000 },
    { id: 'axis-2', label: 'Axis 2: Lagos island, Victoria Island, Surulere, Mushin, Shomolu, Eti osa 1', price: 4000 },
    { id: 'axis-3', label: 'Axis 3: Agege, Ifako-ijaiye, Amuwo Odofin, Ikeja, Kosofe, Apapa, Lagos Mainland, Eti Osa 2', price: 8000 },
    { id: 'axis-4', label: 'Axis 4: Ojo, Epe, Ibeju, Ikorodu, Alimosho, Ajeromi, Eti Osa 3', price: 12000 },
  ],
  shipping_zones: [
    {
      id: 'zone-1',
      name: 'Near Lagos',
      price: 4000,
      states: ['Ogun', 'Oyo', 'Osun', 'Ondo', 'Ekiti', 'Kwara', 'Kogi'],
    },
    {
      id: 'zone-2',
      name: 'Mid Nigeria',
      price: 6500,
      states: [
        'Edo', 'Delta', 'Anambra', 'Enugu', 'Ebonyi', 'Imo', 'Abia',
        'Rivers', 'Bayelsa', 'Akwa Ibom', 'Cross River',
        'Benue', 'FCT', 'Nasarawa', 'Niger', 'Plateau',
      ],
    },
    {
      id: 'zone-3',
      name: 'Far Nigeria',
      price: 9500,
      states: [
        'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Sokoto', 'Zamfara',
        'Jigawa', 'Bauchi', 'Gombe', 'Yobe', 'Borno',
        'Adamawa', 'Taraba',
      ],
    },
  ],
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '13.5px',
  fontWeight: 500,
  backgroundColor: CREAM,
  border: `1px solid ${CREAM_DARK}`,
  color: CHARCOAL,
  outline: 'none',
  transition: 'border-color 0.2s',
};

function computeUnassigned(settings: Settings): string[] {
  const inAnyZone = new Set<string>();
  settings.shipping_zones.forEach((z) => {
    z.states.forEach((s) => inAnyZone.add(s));
  });
  return NIGERIAN_STATES.filter(
    (s) => s !== 'Lagos' && !inAnyZone.has(s)
  );
}

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [statePicker, setStatePicker] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('settings')
        .select('*')
        .eq('key', 'settings')
        .maybeSingle();
      if (data?.value) {
        const merged = { ...DEFAULT_SETTINGS, ...(data.value as Partial<Settings>) };
        if (!Array.isArray(merged.shipping_zones)) {
          merged.shipping_zones = DEFAULT_SETTINGS.shipping_zones;
        }
        setSettings(merged);
      }
      setLoading(false);
    };
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    await supabase
      .from('settings')
      .upsert(
        { key: 'settings', value: settings, updated_at: new Date().toISOString() },
        { onConflict: 'key' }
      );
    setSaving(false);
    setSavedAt(Date.now());
    setTimeout(() => setSavedAt(null), 3000);
  };

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setSettings((s) => ({ ...s, [key]: value }));

  const updateAxis = (id: string, patch: Partial<{ label: string; price: number }>) =>
    setSettings((s) => ({
      ...s,
      lagos_axes: s.lagos_axes.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));

  const addAxis = () => {
    setSettings((s) => ({
      ...s,
      lagos_axes: [...s.lagos_axes, { id: `axis-${Date.now()}`, label: '', price: 0 }],
    }));
  };

  const removeAxis = (id: string) => {
    setSettings((s) => ({ ...s, lagos_axes: s.lagos_axes.filter((a) => a.id !== id) }));
  };

  const updateZone = (id: string, patch: Partial<ShippingZone>) =>
    setSettings((s) => ({
      ...s,
      shipping_zones: s.shipping_zones.map((z) =>
        z.id === id ? { ...z, ...patch } : z
      ),
    }));

  const addZone = () => {
    setSettings((s) => ({
      ...s,
      shipping_zones: [
        ...s.shipping_zones,
        {
          id: `zone-${Date.now()}`,
          name: `Zone ${s.shipping_zones.length + 1}`,
          price: 0,
          states: [],
        },
      ],
    }));
  };

  const removeZone = (id: string) => {
    const zone = settings.shipping_zones.find((z) => z.id === id);
    if (!zone) return;
    if (
      zone.states.length > 0 &&
      !confirm(
        `Remove "${zone.name}"? Its ${zone.states.length} state${
          zone.states.length === 1 ? '' : 's'
        } will become unassigned.`
      )
    ) {
      return;
    }
    setSettings((s) => ({
      ...s,
      shipping_zones: s.shipping_zones.filter((z) => z.id !== id),
    }));
  };

  const addStateToZone = (zoneId: string, state: string) => {
    setSettings((s) => ({
      ...s,
      shipping_zones: s.shipping_zones.map((z) => {
        if (z.id === zoneId) {
          return z.states.includes(state) ? z : { ...z, states: [...z.states, state] };
        }
        return { ...z, states: z.states.filter((st) => st !== state) };
      }),
    }));
  };

  const removeStateFromZone = (zoneId: string, state: string) => {
    setSettings((s) => ({
      ...s,
      shipping_zones: s.shipping_zones.map((z) =>
        z.id === zoneId
          ? { ...z, states: z.states.filter((st) => st !== state) }
          : z
      ),
    }));
  };

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

  const unassigned = computeUnassigned(settings);

  return (
    <div style={{ backgroundColor: CREAM, color: CHARCOAL }}>
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        {/* ── Header ── */}
        <div className="mb-12">
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
            style={{ color: TERRACOTTA }}
          >
            Configuration
          </p>
          <h1 className="mt-3 font-serif text-[30px] leading-none tracking-[-0.02em] text-charcoal sm:text-[36px]">
            Settings
          </h1>
          <p className="mt-3 text-[13px]" style={{ color: MUTED }}>
            Contact, payments, delivery, store status.
          </p>
        </div>

        <div className="space-y-14">
          {/* ── Store status ── */}
          <section
            className="px-7 py-7 sm:px-8 sm:py-8"
            style={{
              border: `1px solid ${
                settings.store_open ? OPEN_GREEN : CLOSED_RED
              }33`,
              backgroundColor: settings.store_open
                ? `${OPEN_GREEN}0F`
                : `${CLOSED_RED}0F`,
            }}
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: MUTED }}
                >
                  Store status
                </p>
                <p
                  className="mt-3 font-serif text-[22px] leading-tight tracking-[-0.01em] sm:text-[26px]"
                  style={{
                    color: settings.store_open ? OPEN_GREEN : CLOSED_RED,
                  }}
                >
                  {settings.store_open ? 'Open — accepting orders' : 'Closed — paused'}
                </p>
                <p className="mt-2 text-[12.5px]" style={{ color: MUTED }}>
                  {settings.store_open
                    ? 'Customers can browse and checkout.'
                    : 'Checkout is disabled.'}
                </p>
              </div>

              <SquareToggle
                checked={settings.store_open}
                onChange={(v) => update('store_open', v)}
                label="Toggle store status"
                onColor={OPEN_GREEN}
              />
            </div>

            {!settings.store_open && (
              <div className="mt-7">
                <label
                  className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.22em]"
                  style={{ color: MUTED }}
                >
                  Closed message (shown on store)
                </label>
                <input
                  type="text"
                  value={settings.closed_message}
                  onChange={(e) => update('closed_message', e.target.value)}
                  placeholder="We're closed for now. Back soon."
                  style={fieldStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = TERRACOTTA)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = CREAM_DARK)
                  }
                />
              </div>
            )}
          </section>

          {/* ── Contact ── */}
          <section>
            <SectionTitle label="Contact" />
            <div
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              <SettingRow
                label="WhatsApp number"
                value={settings.whatsapp_number}
                onChange={(v) => update('whatsapp_number', v)}
                placeholder="2348012345678"
              />
              <SettingRow
                label="Email"
                value={settings.email}
                onChange={(v) => update('email', v)}
                placeholder="hello@kova.ng"
              />
              <SettingRow
                label="Instagram"
                value={settings.instagram}
                onChange={(v) => update('instagram', v)}
                placeholder="https://instagram.com/handle"
              />
              <SettingRow
                label="TikTok"
                value={settings.tiktok}
                onChange={(v) => update('tiktok', v)}
                placeholder="https://tiktok.com/@handle"
                last
              />
            </div>
          </section>

          {/* ── Bank ── */}
          <section>
            <SectionTitle
              label="Bank details"
              sub="Shown to customers who choose Bank Transfer at checkout."
            />
            <div
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              <SettingRow
                label="Bank name"
                value={settings.bank_name}
                onChange={(v) => update('bank_name', v)}
                placeholder="Access Bank"
              />
              <SettingRow
                label="Account name"
                value={settings.bank_account_name}
                onChange={(v) => update('bank_account_name', v)}
                placeholder="KOVA Studio"
              />
              <SettingRow
                label="Account no."
                value={settings.bank_account_number}
                onChange={(v) => update('bank_account_number', v)}
                placeholder="0123456789"
                last
              />
            </div>
          </section>

          {/* ── Payment methods ── */}
          <section>
            <SectionTitle
              label="Payment methods"
              sub="Turn off any method you don't want customers to see at checkout."
            />
            <div
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              <ToggleRow
                label="Pay with card"
                sub="Via Paystack"
                value={settings.payment_paystack_enabled}
                onChange={(v) => update('payment_paystack_enabled', v)}
              />
              <ToggleRow
                label="Bank transfer"
                sub="Customer sends to your account"
                value={settings.payment_transfer_enabled}
                onChange={(v) => update('payment_transfer_enabled', v)}
              />
              <ToggleRow
                label="Pay on delivery"
                sub="Cash or transfer at delivery"
                value={settings.payment_delivery_enabled}
                onChange={(v) => update('payment_delivery_enabled', v)}
                last
              />
            </div>
          </section>

          {/* ── Lagos axes ── */}
          <section>
            <SectionTitle
              label="Delivery zones — Lagos"
              sub="Pricing per axis. Shown to customers in Lagos at checkout."
            />
            <div
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              {settings.lagos_axes.map((axis, idx) => (
                <div
                  key={axis.id}
                  className={`grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-[1fr_140px_auto] sm:items-end sm:gap-6 ${
                    idx === settings.lagos_axes.length - 1
                      ? ''
                      : ''
                  }`}
                  style={{
                    borderBottom:
                      idx === settings.lagos_axes.length - 1
                        ? 'none'
                        : `1px solid ${CREAM_DARK}`,
                  }}
                >
                  <div>
                    <label
                      className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: MUTED }}
                    >
                      Zone
                    </label>
                    <input
                      value={axis.label}
                      onChange={(e) => updateAxis(axis.id, { label: e.target.value })}
                      placeholder="e.g. Axis 5: Badagry, Ibeju, Epe"
                      style={fieldStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = TERRACOTTA)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = CREAM_DARK)
                      }
                    />
                  </div>

                  <div>
                    <label
                      className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: MUTED }}
                    >
                      Price (₦)
                    </label>
                    <input
                      type="number"
                      value={axis.price}
                      onChange={(e) =>
                        updateAxis(axis.id, { price: Number(e.target.value) })
                      }
                      placeholder="5000"
                      style={fieldStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = TERRACOTTA)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = CREAM_DARK)
                      }
                    />
                  </div>

                  <button
                    onClick={() => removeAxis(axis.id)}
                    className="self-start text-[10px] font-bold uppercase tracking-[0.16em] underline-offset-4 transition-colors duration-300 hover:underline sm:self-end sm:pb-3"
                    style={{ color: CLOSED_RED }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addAxis}
              className="mt-5 inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
              style={{ color: MUTED }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = TERRACOTTA)
              }
              onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                className="h-3.5 w-3.5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add zone
            </button>
          </section>

          {/* ── Shipping zones — non-Lagos ── */}
          <section>
            <SectionTitle
              label="Delivery zones — outside Lagos"
              sub="Group other states into flat-rate zones. Each state can only live in one zone."
            />

            <div className="space-y-4">
              {settings.shipping_zones.map((zone) => (
                <div
                  key={zone.id}
                  className="p-6"
                  style={{
                    border: `1px solid ${CREAM_DARK}`,
                    backgroundColor: CREAM,
                  }}
                >
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px] sm:items-end sm:gap-6">
                    <div>
                      <label
                        className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: MUTED }}
                      >
                        Zone name
                      </label>
                      <input
                        value={zone.name}
                        onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                        placeholder="e.g. Near Lagos"
                        style={fieldStyle}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = TERRACOTTA)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = CREAM_DARK)
                        }
                      />
                    </div>

                    <div>
                      <label
                        className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: MUTED }}
                      >
                        Price (₦)
                      </label>
                      <input
                        type="number"
                        value={zone.price}
                        onChange={(e) =>
                          updateZone(zone.id, { price: Number(e.target.value) })
                        }
                        placeholder="4000"
                        style={fieldStyle}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = TERRACOTTA)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = CREAM_DARK)
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between gap-3">
                      <label
                        className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
                        style={{ color: MUTED }}
                      >
                        States in this zone
                      </label>
                      <span
                        className="font-numbers text-[11px]"
                        style={{ color: MUTED_SOFT }}
                      >
                        {zone.states.length}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {zone.states.map((s) => (
                        <button
                          key={s}
                          onClick={() => removeStateFromZone(zone.id, s)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11.5px] font-medium text-charcoal transition-colors duration-300"
                          style={{ border: `1px solid ${CREAM_DARK}` }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.borderColor = TERRACOTTA)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.borderColor = CREAM_DARK)
                          }
                        >
                          {s}
                          <span
                            className="text-[13px] leading-none"
                            style={{ color: MUTED_SOFT }}
                          >
                            ×
                          </span>
                        </button>
                      ))}

                      <button
                        onClick={() => setStatePicker(zone.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] transition-colors duration-300"
                        style={{
                          border: `1px dashed ${CREAM_DARK}`,
                          color: MUTED,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = TERRACOTTA;
                          e.currentTarget.style.color = TERRACOTTA;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = CREAM_DARK;
                          e.currentTarget.style.color = MUTED;
                        }}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          className="h-3 w-3"
                        >
                          <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add state
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeZone(zone.id)}
                    className="mt-5 text-[10px] font-bold uppercase tracking-[0.16em] underline-offset-4 transition-colors duration-300 hover:underline"
                    style={{ color: CLOSED_RED }}
                  >
                    Remove zone
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addZone}
              className="mt-5 inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
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
                className="h-3.5 w-3.5"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
              Add another zone
            </button>

            {unassigned.length > 0 && (
              <div
                className="mt-5 px-5 py-4"
                style={{
                  border: `1px solid ${WARN}33`,
                  backgroundColor: `${WARN}0F`,
                }}
              >
                <p
                  className="text-[10.5px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: WARN }}
                >
                  {unassigned.length} state{unassigned.length === 1 ? '' : 's'} not in any zone
                </p>
                <p
                  className="mt-1.5 text-[12px]"
                  style={{ color: 'rgba(169,120,20,0.85)' }}
                >
                  Customers in these states won't see a shipping price at checkout:{' '}
                  {unassigned.join(', ')}
                </p>
              </div>
            )}
          </section>

          {/* ── Save ── */}
          <div className="flex flex-col items-stretch gap-4 pt-2 sm:flex-row sm:items-center sm:justify-end">
            {savedAt && (
              <p
                className="text-center text-[10.5px] font-bold uppercase tracking-[0.18em] sm:text-right"
                style={{ color: OPEN_GREEN }}
              >
                ✓ Saved
              </p>
            )}
            <button
              onClick={save}
              disabled={saving}
              className="py-4 text-[11.5px] font-bold uppercase tracking-[0.22em] transition-colors duration-300 disabled:opacity-60 sm:px-10"
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
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>

      {/* ── State picker ── */}
      {statePicker && (
        <StatePicker
          zones={settings.shipping_zones}
          currentZoneId={statePicker}
          onPick={(state) => {
            addStateToZone(statePicker, state);
            setStatePicker(null);
          }}
          onClose={() => setStatePicker(null)}
        />
      )}
    </div>
  );
}

/* ═════════════════════════════════════════════
   SUB-COMPONENTS
   ═════════════════════════════════════════════ */

function StatePicker({
  zones,
  currentZoneId,
  onPick,
  onClose,
}: {
  zones: ShippingZone[];
  currentZoneId: string;
  onPick: (state: string) => void;
  onClose: () => void;
}) {
  const zoneByState: Record<string, string> = {};
  zones.forEach((z) => {
    z.states.forEach((s) => {
      zoneByState[s] = z.name;
    });
  });

  const available = NIGERIAN_STATES.filter((s) => {
    if (s === 'Lagos') return false;
    const currentZone = zones.find((z) => z.id === currentZoneId);
    if (currentZone?.states.includes(s)) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div
        className="relative flex max-h-[80vh] w-full max-w-lg flex-col"
        style={{ backgroundColor: CREAM, color: CHARCOAL }}
      >
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
        >
          <h3 className="text-[11.5px] font-bold uppercase tracking-[0.18em] text-charcoal">
            Add state to zone
          </h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center transition-colors duration-300"
            style={{ color: MUTED }}
            onMouseEnter={(e) => (e.currentTarget.style.color = TERRACOTTA)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              className="h-[16px] w-[16px]"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {available.map((s) => {
            const inZone = zoneByState[s];
            return (
              <button
                key={s}
                onClick={() => onPick(s)}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-[13px] text-charcoal transition-colors duration-200"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = CREAM_DARK)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = 'transparent')
                }
              >
                <span className="uppercase tracking-[0.06em]">{s}</span>
                {inZone && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-[0.14em]"
                    style={{ color: MUTED_SOFT }}
                  >
                    Currently in {inZone}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="mb-5">
      <h2
        className="text-[11px] font-bold uppercase tracking-[0.28em]"
        style={{ color: TERRACOTTA }}
      >
        {label}
      </h2>
      {sub && (
        <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
          {sub}
        </p>
      )}
    </div>
  );
}

function SettingRow({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-[200px_1fr] sm:items-center sm:gap-6 ${
        disabled ? 'opacity-50' : ''
      }`}
      style={{
        borderBottom: last ? 'none' : `1px solid ${CREAM_DARK}`,
      }}
    >
      <label
        className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
        style={{ color: MUTED }}
      >
        {label}
      </label>
      <input
        type={type}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-[13.5px] font-medium outline-none transition-colors sm:text-right"
        style={{
          backgroundColor: 'transparent',
          border: `1px solid transparent`,
          color: CHARCOAL,
        }}
        onFocus={(e) => {
          e.currentTarget.style.backgroundColor = CREAM;
          e.currentTarget.style.borderColor = TERRACOTTA;
        }}
        onBlur={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
      />
    </div>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
  last,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <div
      className="flex items-center justify-between gap-4 px-6 py-5"
      style={{ borderBottom: last ? 'none' : `1px solid ${CREAM_DARK}` }}
    >
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-charcoal">{label}</p>
        <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
          {sub}
        </p>
      </div>
      <SquareToggle
        checked={value}
        onChange={onChange}
        label={label}
        onColor={CHARCOAL}
      />
    </div>
  );
}

function SquareToggle({
  checked,
  onChange,
  label,
  onColor,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  onColor: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-label={label}
      className="relative flex h-6 w-11 flex-shrink-0 items-center transition-colors duration-300"
      style={{
        backgroundColor: checked ? onColor : 'rgba(26,26,26,0.15)',
      }}
    >
      <span
        className="absolute h-5 w-5 bg-white shadow-sm transition-transform duration-300"
        style={{
          transform: checked ? 'translateX(22px)' : 'translateX(2px)',
        }}
      />
    </button>
  );
}