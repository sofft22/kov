import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useSettings } from '../context/SettingsContext';
import { formatPrice, generateOrderId } from '../config';
import { NIGERIAN_STATES } from '../lib/data';
import {
  createOrder,
  validateCoupon,
  calculateDiscount,
  incrementCouponUse,
  normalizePhone,
  isValidNigerianPhone,
  zoneForState,
  type Coupon,
} from '../lib/store';
import { FakePaystack } from './FakePaystack';

const LS_KEY = 'cimmple_my_orders_v1';

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.5)';
const MUTED_SOFT = 'rgba(26,26,26,0.35)';
const ERROR = '#B42828';

const fieldStyle: React.CSSProperties = {
  backgroundColor: CREAM,
  border: `1px solid ${CREAM_DARK}`,
  color: CHARCOAL,
};

function saveOrderLocally(order: { token: string; orderId: string; date: string }) {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = Array.isArray(list)
      ? list.filter((o: any) => o?.token !== order.token)
      : [];
    filtered.unshift(order);
    localStorage.setItem(LS_KEY, JSON.stringify(filtered.slice(0, 20)));
  } catch {
    // ignore
  }
}

type PaymentMethod = 'paystack' | 'transfer' | 'delivery';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CheckoutSheet({ open, onClose }: Props) {
  const { settings } = useSettings();
  const { items, subtotal, clearCart } = useCart();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [axisId, setAxisId] = useState(settings.lagos_axes[0]?.id ?? '');
  const [payment, setPayment] = useState<PaymentMethod | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);

  const [showFakePaystack, setShowFakePaystack] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [placedToken, setPlacedToken] = useState<string | null>(null);
  const [placedMethod, setPlacedMethod] = useState<PaymentMethod | null>(null);
  const [placedTotal, setPlacedTotal] = useState<number>(0);
  const [placedZoneName, setPlacedZoneName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [orderError, setOrderError] = useState('');

  useEffect(() => {
    if (!phone) {
      setPhoneError('');
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      setPhoneError('Enter a valid Nigerian number');
    } else {
      setPhoneError('');
    }
  }, [phone]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [placedOrderId]);

  const shipping = useMemo(() => {
    if (state === 'Lagos') {
      const axis = settings.lagos_axes.find((a) => a.id === axisId);
      return axis?.price ?? 0;
    }
    const zone = zoneForState(state, settings.shipping_zones);
    return zone?.price ?? 0;
  }, [state, axisId, settings.lagos_axes, settings.shipping_zones]);

  const zoneName = useMemo(() => {
    if (state === 'Lagos') return null;
    const zone = zoneForState(state, settings.shipping_zones);
    return zone?.name ?? null;
  }, [state, settings.shipping_zones]);

  const { discount, shippingAfter } = useMemo(() => {
    if (!appliedCoupon) return { discount: 0, shippingAfter: shipping };
    return calculateDiscount(appliedCoupon, subtotal, shipping);
  }, [appliedCoupon, subtotal, shipping]);

  const total = Math.max(0, subtotal - discount) + shippingAfter;

  const canSubmit = Boolean(
    firstName.trim() &&
      lastName.trim() &&
      isValidNigerianPhone(phone) &&
      email.trim().includes('@') &&
      address.trim() &&
      city.trim() &&
      payment !== null &&
      shipping > 0
  );

  const handleApplyCoupon = async () => {
    setCouponError('');
    setAppliedCoupon(null);

    if (!couponCode.trim()) {
      setCouponError('Enter a code');
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      setCouponError('Enter a valid phone number first');
      return;
    }

    setCouponLoading(true);
    const { coupon, error } = await validateCoupon(
      couponCode,
      subtotal,
      normalizePhone(phone)
    );
    setCouponLoading(false);

    if (error || !coupon) {
      setCouponError(error ?? 'Invalid code');
      return;
    }
    setAppliedCoupon(coupon);
    setCouponCode(coupon.code.toUpperCase());
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const placeOrder = async (method: PaymentMethod) => {
    if (submitting) return;
    setOrderError('');
    setSubmitting(true);

    const normalizedPhone = normalizePhone(phone);

    let finalDiscount = discount;
    let finalCoupon: Coupon | null = appliedCoupon;

    if (appliedCoupon) {
      const { coupon: fresh, error } = await validateCoupon(
        appliedCoupon.code,
        subtotal,
        normalizedPhone
      );
      if (error || !fresh) {
        finalCoupon = null;
        finalDiscount = 0;
      } else {
        finalCoupon = fresh;
      }
    }

    const finalShippingAfter =
      finalCoupon?.type === 'shipping' ? 0 : shipping;

    const finalTotal =
      Math.max(0, subtotal - finalDiscount) + finalShippingAfter;

    const orderId = generateOrderId();
    const fullName = `${firstName} ${lastName}`.trim();

    const itemsForDb = items.map((i) => ({
      productId: i.product.id,
      name: i.product.name,
      variant: i.variant ?? null,
      qty: i.quantity,
      price: i.product.price + (i.variantPriceDelta ?? 0),
      image_url: i.product.image_url,
    }));

    const { error, tracking_token } = await createOrder({
      order_id: orderId,
      customer_name: fullName,
      customer_phone: normalizedPhone,
      customer_email: email.trim() || null,
      address: address.trim(),
      apartment: apartment.trim() || null,
      city: city.trim(),
      state,
      shipping_axis: state === 'Lagos' ? axisId : null,
      shipping_price: finalShippingAfter,
      items: itemsForDb,
      subtotal,
      total: finalTotal,
      payment_method: method,
      payment_status: method === 'paystack' ? 'paid' : 'pending',
      status: 'new',
      notes: null,
      coupon_code: finalCoupon?.code ?? null,
      discount_amount: finalDiscount || null,
    });

    if (error) {
      setOrderError('Something went wrong. Please try again.');
      setSubmitting(false);
      return;
    }

    if (tracking_token) {
      saveOrderLocally({
        token: tracking_token,
        orderId,
        date: new Date().toISOString(),
      });
    }

    if (finalCoupon) {
      await incrementCouponUse(finalCoupon.id);
    }

    setPlacedOrderId(orderId);
    setPlacedToken(tracking_token ?? null);
    setPlacedMethod(method);
    setPlacedTotal(finalTotal);
    setPlacedZoneName(zoneName);
    setSubmitting(false);
    clearCart();
  };

  /* ─── WhatsApp message — clean and arranged ─── */
  const buildWhatsAppMessage = (
    method: PaymentMethod,
    totalOverride: number,
    orderId: string,
    token: string | null
  ) => {
    const itemLines = items
      .map((i) => {
        const variant = i.variant ? ` — ${i.variant}` : '';
        const lineTotal =
          (i.product.price + (i.variantPriceDelta ?? 0)) * i.quantity;
        return `• ${i.product.name}${variant} ×${i.quantity}  ·  ${formatPrice(
          lineTotal
        )}`;
      })
      .join('\n');

    const fullName = `${firstName} ${lastName}`.trim();
    const fullAddress = `${address}${apartment ? ', ' + apartment : ''}, ${city}, ${state}`;

    const methodLabel =
      method === 'paystack'
        ? 'Paid online'
        : method === 'transfer'
        ? 'Bank transfer'
        : 'Pay on delivery';

    const lines = [
      `KOVA — New order`,
      ``,
      `Order ID: ${orderId}`,
      `Placed: ${new Date().toLocaleString('en-NG', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}`,
      ``,
      `— Items —`,
      itemLines,
      ``,
      `— Summary —`,
      `Subtotal: ${formatPrice(subtotal)}`,
    ];

    if (appliedCoupon) {
      if (appliedCoupon.type === 'shipping') {
        lines.push(`Discount: Free shipping (${appliedCoupon.code})`);
      } else {
        lines.push(
          `Discount: -${formatPrice(discount)} (${appliedCoupon.code})`
        );
      }
    }

    lines.push(`Shipping: ${formatPrice(shippingAfter)}`);
    lines.push(`Total: ${formatPrice(totalOverride)}`);
    lines.push(``);
    lines.push(`— Customer —`);
    lines.push(`Name: ${fullName}`);
    lines.push(`Phone: ${normalizePhone(phone)}`);
    if (email.trim()) lines.push(`Email: ${email.trim()}`);
    lines.push(`Address: ${fullAddress}`);
    lines.push(``);
    lines.push(`— Payment —`);
    lines.push(`${methodLabel}`);

    if (token) {
      lines.push(``);
      lines.push(`Track: ${window.location.origin}/order/${token}`);
    }

    if (method === 'transfer') {
      lines.push(``);
      lines.push(`📎 Sending receipt next.`);
    }

    return lines.join('\n');
  };

  const handleSendWhatsApp = (method: PaymentMethod) => {
    if (!placedOrderId) return;
    const msg = buildWhatsAppMessage(
      method,
      placedTotal,
      placedOrderId,
      placedToken
    );
    window.open(
      `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const handlePayNow = () => {
    if (!canSubmit || !payment) return;
    if (payment === 'paystack') {
      setShowFakePaystack(true);
    } else {
      placeOrder(payment);
    }
  };

  const resetForm = () => {
    setPlacedOrderId(null);
    setPlacedToken(null);
    setPlacedMethod(null);
    setPlacedTotal(0);
    setPlacedZoneName(null);
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    setOrderError('');
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setPhoneError('');
    setAddress('');
    setApartment('');
    setCity('');
    setState('Lagos');
    setAxisId(settings.lagos_axes[0]?.id ?? '');
    setPayment(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCopyTracking = async () => {
    if (!placedToken) return;
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/order/${placedToken}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt(
        'Copy this link:',
        `${window.location.origin}/order/${placedToken}`
      );
    }
  };

  if (!open) return null;

  const paymentOptions = [
    settings.payment_paystack_enabled && {
      id: 'paystack' as const,
      label: 'Pay now with card',
      sub: 'Secure card payment',
    },
    settings.payment_transfer_enabled && {
      id: 'transfer' as const,
      label: 'Bank transfer',
      sub: 'Transfer and send proof on WhatsApp',
    },
    settings.payment_delivery_enabled && {
      id: 'delivery' as const,
      label: 'Pay on delivery',
      sub: 'Pay when it arrives',
    },
  ].filter(Boolean) as { id: PaymentMethod; label: string; sub: string }[];

  return (
    <div className="fixed inset-0 z-[55] flex justify-end">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full flex-col sm:max-w-[560px]"
        style={{ backgroundColor: CREAM, color: CHARCOAL }}
      >
        {/* ── Header ── */}
        <div
          className="flex flex-shrink-0 items-center justify-between px-5 py-5 sm:px-6 sm:py-6"
          style={{
            borderBottom: `1px solid ${CREAM_DARK}`,
            paddingTop: 'max(1.25rem, env(safe-area-inset-top))',
          }}
        >
          <h2 className="font-serif text-[22px] leading-none tracking-[-0.02em] text-charcoal sm:text-[26px]">
            {placedOrderId ? 'Order placed' : 'Checkout'}
          </h2>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center transition-colors duration-300"
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
              className="h-[18px] w-[18px]"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* ── Content ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain">
          {placedOrderId ? (
            <PlacedScreen
              orderId={placedOrderId}
              token={placedToken}
              method={placedMethod!}
              total={placedTotal}
              zoneName={placedZoneName}
              bankName={settings.bank_name}
              bankAccountName={settings.bank_account_name}
              bankAccountNumber={settings.bank_account_number}
              copied={copied}
              onCopyTracking={handleCopyTracking}
              onSendWhatsApp={() => handleSendWhatsApp(placedMethod!)}
              onClose={handleClose}
            />
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-5 px-8 py-14 text-center">
              <p className="text-[13px]" style={{ color: MUTED }}>
                Your bag is empty.
              </p>
              <button
                onClick={handleClose}
                className="px-7 py-3 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
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
                Back to shop
              </button>
            </div>
          ) : (
            <div className="px-5 py-6 sm:px-6 sm:py-8">
              {/* ── ORDER SUMMARY ── */}
              <section>
                <div className="mb-4 flex items-baseline justify-between">
                  <h3
                    className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
                    style={{ color: CHARCOAL }}
                  >
                    Order summary
                  </h3>
                  <span className="text-[11px]" style={{ color: MUTED }}>
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

                <div
                  className="p-5"
                  style={{
                    border: `1px solid ${CREAM_DARK}`,
                    backgroundColor: CREAM,
                  }}
                >
                  <div className="space-y-4">
                    {items.map((item) => {
                      const key = `${item.product.id}::${item.variant ?? ''}`;
                      const line =
                        (item.product.price + (item.variantPriceDelta ?? 0)) *
                        item.quantity;
                      return (
                        <div key={key} className="flex gap-3">
                          <div
                            className="h-16 w-16 flex-shrink-0 overflow-hidden"
                            style={{ backgroundColor: CREAM_DARK }}
                          >
                            {item.product.image_url && (
                              <img
                                src={item.product.image_url}
                                alt=""
                                className="h-full w-full object-contain"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[11.5px] font-normal uppercase tracking-[0.08em] text-charcoal">
                              {item.product.name}
                            </p>
                            {item.variant && (
                              <p
                                className="mt-1 text-[10.5px] uppercase tracking-[0.08em]"
                                style={{ color: MUTED }}
                              >
                                {item.variant}
                              </p>
                            )}
                            <p
                              className="mt-1 text-[10.5px] uppercase tracking-[0.1em]"
                              style={{ color: MUTED_SOFT }}
                            >
                              Qty {item.quantity}
                            </p>
                          </div>
                          <p className="font-numbers whitespace-nowrap text-[12.5px] text-charcoal">
                            {formatPrice(line)}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Coupon */}
                  <div
                    className="mt-5 pt-5"
                    style={{ borderTop: `1px solid ${CREAM_DARK}` }}
                  >
                    {appliedCoupon ? (
                      <div
                        className="flex items-center justify-between gap-3 px-4 py-3"
                        style={{
                          border: `1px solid ${CREAM_DARK}`,
                          backgroundColor: CREAM,
                        }}
                      >
                        <div className="min-w-0">
                          <p
                            className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
                            style={{ color: CHARCOAL }}
                          >
                            {appliedCoupon.code}
                          </p>
                          <p
                            className="mt-0.5 text-[11px]"
                            style={{ color: MUTED }}
                          >
                            {appliedCoupon.type === 'shipping'
                              ? 'Free shipping applied'
                              : appliedCoupon.type === 'percent'
                              ? `${appliedCoupon.value}% off`
                              : `₦${appliedCoupon.value.toLocaleString('en-NG')} off`}
                          </p>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
                          style={{ color: MUTED }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = TERRACOTTA)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = MUTED)
                          }
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <label
                          className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
                          style={{ color: MUTED }}
                        >
                          Discount code
                        </label>
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={couponCode}
                            onChange={(e) =>
                              setCouponCode(e.target.value.toUpperCase())
                            }
                            placeholder="Enter code"
                            className="flex-1 px-4 py-2.5 text-[12.5px] font-medium uppercase tracking-[0.04em] outline-none transition-colors"
                            style={fieldStyle}
                            onFocus={(e) =>
                              (e.currentTarget.style.borderColor = TERRACOTTA)
                            }
                            onBlur={(e) =>
                              (e.currentTarget.style.borderColor = CREAM_DARK)
                            }
                          />
                          <button
                            onClick={handleApplyCoupon}
                            disabled={couponLoading}
                            className="shrink-0 px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300 disabled:opacity-50"
                            style={{ border: `1px solid ${CHARCOAL}`, color: CHARCOAL }}
                            onMouseEnter={(e) => {
                              if (!couponLoading) {
                                e.currentTarget.style.backgroundColor =
                                  CHARCOAL;
                                e.currentTarget.style.color = CREAM;
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!couponLoading) {
                                e.currentTarget.style.backgroundColor =
                                  'transparent';
                                e.currentTarget.style.color = CHARCOAL;
                              }
                            }}
                          >
                            {couponLoading ? '…' : 'Apply'}
                          </button>
                        </div>
                        {couponError && (
                          <p
                            className="mt-2 text-[11px] font-medium"
                            style={{ color: ERROR }}
                          >
                            {couponError}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div
                    className="mt-5 space-y-2.5 pt-5"
                    style={{ borderTop: `1px solid ${CREAM_DARK}` }}
                  >
                    <div
                      className="flex justify-between text-[12.5px]"
                      style={{ color: MUTED }}
                    >
                      <span>Subtotal</span>
                      <span className="font-numbers text-charcoal">
                        {formatPrice(subtotal)}
                      </span>
                    </div>
                    {discount > 0 && (
                      <div
                        className="flex justify-between text-[12.5px]"
                        style={{ color: TERRACOTTA }}
                      >
                        <span>Discount</span>
                        <span className="font-numbers">
                          -{formatPrice(discount)}
                        </span>
                      </div>
                    )}
                    <div
                      className="flex justify-between text-[12.5px]"
                      style={{ color: MUTED }}
                    >
                      <span>Shipping</span>
                      <span className="font-numbers text-charcoal">
                        {shippingAfter === 0 && appliedCoupon?.type === 'shipping'
                          ? 'Free'
                          : formatPrice(shippingAfter)}
                      </span>
                    </div>
                    <div
                      className="flex items-baseline justify-between pt-3"
                      style={{ borderTop: `1px solid ${CREAM_DARK}` }}
                    >
                      <span
                        className="text-[10.5px] font-bold uppercase tracking-[0.22em]"
                        style={{ color: CHARCOAL }}
                      >
                        Total
                      </span>
                      <span className="font-numbers text-[17px] text-charcoal">
                        {formatPrice(total)}
                      </span>
                    </div>
                  </div>
                </div>
              </section>

              {/* ── CONTACT ── */}
              <section className="mt-10">
                <h3
                  className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.24em]"
                  style={{ color: CHARCOAL }}
                >
                  Contact
                </h3>
                <div className="space-y-4">
                  <Field label="Email">
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 text-[13px] font-medium outline-none transition-colors"
                      style={fieldStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = TERRACOTTA)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = CREAM_DARK)
                      }
                    />
                  </Field>
                  <Field label="Phone" error={phoneError}>
                    <input
                      type="tel"
                      placeholder="08012345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 text-[13px] font-medium outline-none transition-colors"
                      style={{
                        ...fieldStyle,
                        borderColor: phoneError ? ERROR : CREAM_DARK,
                      }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = TERRACOTTA)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = phoneError
                          ? ERROR
                          : CREAM_DARK)
                      }
                    />
                  </Field>
                </div>
              </section>

              {/* ── DELIVERY ── */}
              <section className="mt-10">
                <h3
                  className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.24em]"
                  style={{ color: CHARCOAL }}
                >
                  Delivery
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="First name">
                      <input
                        type="text"
                        placeholder="Ada"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full px-4 py-3 text-[13px] font-medium outline-none transition-colors"
                        style={fieldStyle}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = TERRACOTTA)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = CREAM_DARK)
                        }
                      />
                    </Field>
                    <Field label="Last name">
                      <input
                        type="text"
                        placeholder="Okafor"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 text-[13px] font-medium outline-none transition-colors"
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
                  <Field label="Street address">
                    <input
                      type="text"
                      placeholder="12 Admiralty Way"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-3 text-[13px] font-medium outline-none transition-colors"
                      style={fieldStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = TERRACOTTA)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = CREAM_DARK)
                      }
                    />
                  </Field>
                  <Field label="Apartment" optional>
                    <input
                      type="text"
                      placeholder="Flat 3B"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      className="w-full px-4 py-3 text-[13px] font-medium outline-none transition-colors"
                      style={fieldStyle}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = TERRACOTTA)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = CREAM_DARK)
                      }
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="City">
                      <input
                        type="text"
                        placeholder="Lekki"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-3 text-[13px] font-medium outline-none transition-colors"
                        style={fieldStyle}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = TERRACOTTA)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = CREAM_DARK)
                        }
                      />
                    </Field>
                    <Field label="State">
                      <select
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-3 text-[13px] font-medium outline-none transition-colors"
                        style={fieldStyle}
                        onFocus={(e) =>
                          (e.currentTarget.style.borderColor = TERRACOTTA)
                        }
                        onBlur={(e) =>
                          (e.currentTarget.style.borderColor = CREAM_DARK)
                        }
                      >
                        {NIGERIAN_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>

                {state === 'Lagos' && settings.lagos_axes.length > 0 && (
                  <div className="mt-5">
                    <label
                      className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: MUTED }}
                    >
                      Lagos zone
                    </label>
                    <div className="mt-2 space-y-2">
                      {settings.lagos_axes.map((axis) => {
                        const active = axisId === axis.id;
                        return (
                          <label
                            key={axis.id}
                            className="flex cursor-pointer items-start gap-3 p-4 transition-colors duration-300"
                            style={{
                              border: `1px solid ${
                                active ? CHARCOAL : CREAM_DARK
                              }`,
                              backgroundColor: CREAM,
                            }}
                          >
                            <input
                              type="radio"
                              name="axis"
                              checked={active}
                              onChange={() => setAxisId(axis.id)}
                              className="mt-1"
                              style={{ accentColor: CHARCOAL }}
                            />
                            <div className="flex-1">
                              <p className="text-[12px] leading-relaxed text-charcoal">
                                {axis.label}
                              </p>
                            </div>
                            <p className="font-numbers whitespace-nowrap text-[12.5px] text-charcoal">
                              {formatPrice(axis.price)}
                            </p>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {state !== 'Lagos' && (
                  <div
                    className="mt-5 p-4"
                    style={{
                      border: `1px solid ${CREAM_DARK}`,
                      backgroundColor: CREAM,
                    }}
                  >
                    {zoneName ? (
                      <>
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[12px] font-medium text-charcoal">
                            {zoneName}
                          </p>
                          <p className="font-numbers text-[12.5px] text-charcoal">
                            {formatPrice(shipping)}
                          </p>
                        </div>
                        <p
                          className="mt-1.5 text-[10.5px]"
                          style={{ color: MUTED }}
                        >
                          2–5 business days via courier
                        </p>
                      </>
                    ) : (
                      <p
                        className="text-[12px] font-medium"
                        style={{ color: ERROR }}
                      >
                        We don't deliver to {state} yet.
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* ── PAYMENT ── */}
              <section className="mt-10 mb-8">
                <h3
                  className="mb-4 text-[10.5px] font-bold uppercase tracking-[0.24em]"
                  style={{ color: CHARCOAL }}
                >
                  Payment
                </h3>
                <div className="space-y-2">
                  {paymentOptions.map((opt) => {
                    const active = payment === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-start gap-3 p-4 transition-colors duration-300"
                        style={{
                          border: `1px solid ${active ? CHARCOAL : CREAM_DARK}`,
                          backgroundColor: CREAM,
                        }}
                      >
                        <input
                          type="radio"
                          name="payment"
                          checked={active}
                          onChange={() => setPayment(opt.id)}
                          className="mt-1"
                          style={{ accentColor: CHARCOAL }}
                        />
                        <div>
                          <p className="text-[12px] font-medium uppercase tracking-[0.06em] text-charcoal">
                            {opt.label}
                          </p>
                          <p
                            className="mt-0.5 text-[11px]"
                            style={{ color: MUTED }}
                          >
                            {opt.sub}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </section>

              {orderError && (
                <p
                  className="mb-2 px-4 py-3 text-[12px] font-medium"
                  style={{
                    backgroundColor: '#FBEDED',
                    color: ERROR,
                    border: `1px solid ${ERROR}33`,
                  }}
                >
                  {orderError}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Footer — the ONLY black CTA ── */}
        {!placedOrderId && items.length > 0 && (
          <div
            className="flex-shrink-0 px-5 pt-4 sm:px-6"
            style={{
              borderTop: `1px solid ${CREAM_DARK}`,
              backgroundColor: CREAM,
              paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            }}
          >
            <button
              onClick={handlePayNow}
              disabled={!canSubmit || submitting}
              className="flex w-full items-center justify-between px-6 py-4 transition-colors duration-300"
              style={{
                backgroundColor:
                  canSubmit && !submitting ? CHARCOAL : 'rgba(26,26,26,0.25)',
                color: CREAM,
                cursor: canSubmit && !submitting ? 'pointer' : 'not-allowed',
              }}
              onMouseEnter={(e) => {
                if (canSubmit && !submitting)
                  e.currentTarget.style.backgroundColor = TERRACOTTA;
              }}
              onMouseLeave={(e) => {
                if (canSubmit && !submitting)
                  e.currentTarget.style.backgroundColor = CHARCOAL;
              }}
            >
              <span className="text-[11px] font-bold uppercase tracking-[0.22em]">
                {submitting ? 'Placing…' : 'Place order'}
              </span>
              <span className="font-numbers text-[15px]">
                {formatPrice(total)}
              </span>
            </button>
          </div>
        )}
      </div>

      {showFakePaystack && (
        <FakePaystack
          amount={total}
          email={email}
          onCancel={() => setShowFakePaystack(false)}
          onSuccess={() => {
            setShowFakePaystack(false);
            placeOrder('paystack');
          }}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   FIELD
   ───────────────────────────────────────────── */
function Field({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label
          className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
          style={{ color: MUTED }}
        >
          {label}
          {optional && (
            <span
              className="ml-1.5 font-normal normal-case tracking-normal"
              style={{ color: MUTED_SOFT }}
            >
              (optional)
            </span>
          )}
        </label>
      </div>
      {children}
      {error && (
        <p
          className="mt-1.5 text-[11px] font-medium"
          style={{ color: ERROR }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   PLACED SCREEN
   ───────────────────────────────────────────── */
function PlacedScreen({
  orderId,
  token,
  method,
  total,
  zoneName,
  bankName,
  bankAccountName,
  bankAccountNumber,
  copied,
  onCopyTracking,
  onSendWhatsApp,
  onClose,
}: {
  orderId: string;
  token: string | null;
  method: PaymentMethod;
  total: number;
  zoneName: string | null;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  copied: boolean;
  onCopyTracking: () => void;
  onSendWhatsApp: () => void;
  onClose: () => void;
}) {
  return (
    <div className="px-5 py-8 sm:px-6 sm:py-10">
      {/* Check icon — outlined, not black */}
      <div className="text-center">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center"
          style={{
            border: `1px solid ${CHARCOAL}`,
            color: CHARCOAL,
            backgroundColor: CREAM,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            className="h-6 w-6"
          >
            <path
              d="M5 13l4 4L19 7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 className="mt-6 font-serif text-[26px] leading-tight tracking-[-0.02em] text-charcoal">
          Thank you.
        </h3>
        <p className="mt-2 text-[12.5px]" style={{ color: MUTED }}>
          Your order has been received.
        </p>
      </div>

      {/* Order ID */}
      <div
        className="mt-7 px-6 py-5 text-center"
        style={{
          border: `1px solid ${CREAM_DARK}`,
          backgroundColor: CREAM,
        }}
      >
        <p
          className="text-[10px] font-bold uppercase tracking-[0.26em]"
          style={{ color: MUTED }}
        >
          Order ID
        </p>
        <p className="mt-2 font-numbers text-[24px] leading-none text-charcoal">
          {orderId}
        </p>
      </div>

      {/* Transfer steps */}
      {method === 'transfer' && (
        <div className="mt-7">
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.24em]"
            style={{ color: CHARCOAL }}
          >
            Next step
          </p>

          <div className="mt-4 space-y-2">
            <StepRow number="1">
              <p className="text-[12px] text-charcoal">
                Transfer{' '}
                <span className="font-numbers">{formatPrice(total)}</span> to:
              </p>
              <div className="mt-2.5 space-y-1.5 text-[12px] text-charcoal">
                <p>
                  <span style={{ color: MUTED }}>Bank:</span> {bankName}
                </p>
                <p>
                  <span style={{ color: MUTED }}>Account:</span>{' '}
                  <span className="font-numbers">{bankAccountNumber}</span>
                </p>
                <p>
                  <span style={{ color: MUTED }}>Name:</span> {bankAccountName}
                </p>
              </div>
            </StepRow>

            <StepRow number="2">
              <p className="text-[12px] text-charcoal">
                Screenshot the receipt.
              </p>
            </StepRow>

            <StepRow number="3">
              <p className="text-[12px] text-charcoal">
                Send it to us on WhatsApp.
              </p>
            </StepRow>
          </div>

          <button
            onClick={onSendWhatsApp}
            className="mt-4 flex w-full items-center justify-center gap-2.5 px-6 py-4 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-300"
            style={{ backgroundColor: CHARCOAL, color: CREAM }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = TERRACOTTA)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = CHARCOAL)
            }
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
              <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
            </svg>
            Send receipt on WhatsApp
          </button>
          <p className="mt-2.5 text-center text-[11px]" style={{ color: MUTED }}>
            Attach your receipt before sending.
          </p>
        </div>
      )}

      {method !== 'transfer' && (
        <div
          className="mt-7 p-5"
          style={{ border: `1px solid ${CREAM_DARK}`, backgroundColor: CREAM }}
        >
          <p className="text-[12px] text-charcoal">
            {method === 'paystack'
              ? "Payment received. We'll confirm on WhatsApp shortly."
              : "We'll reach out on WhatsApp to arrange delivery."}
          </p>
          <button
            onClick={onSendWhatsApp}
            className="mt-4 flex w-full items-center justify-center px-5 py-3 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
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
            Send a message
          </button>
        </div>
      )}

      {/* Tracking */}
      {token && (
        <div
          className="mt-6 p-5"
          style={{ border: `1px solid ${CREAM_DARK}`, backgroundColor: CREAM }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-[0.24em]"
            style={{ color: MUTED }}
          >
            Track your order
          </p>
          <p className="mt-2 break-all text-[11px]" style={{ color: MUTED }}>
            {window.location.origin}/order/{token}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to={`/order/${token}`}
              className="inline-flex items-center px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
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
              Track order
            </Link>
            <button
              onClick={onCopyTracking}
              className="inline-flex items-center px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
              style={{ border: `1px solid ${CREAM_DARK}`, color: CHARCOAL }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.borderColor = CHARCOAL)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.borderColor = CREAM_DARK)
              }
            >
              {copied ? 'Copied ✓' : 'Copy link'}
            </button>
          </div>
        </div>
      )}

      {zoneName && (
        <p className="mt-5 text-center text-[11px]" style={{ color: MUTED }}>
          Delivery to {zoneName} · 2–5 business days
        </p>
      )}

      {/* Bottom actions — outlined, no more black stacking */}
      <div className="mt-8 flex flex-col items-stretch gap-2.5 sm:flex-row sm:justify-center">
        <Link
          to="/my-orders"
          className="inline-flex items-center justify-center px-6 py-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-charcoal transition-colors duration-300"
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
          View my orders
        </Link>
        <button
          onClick={onClose}
          className="inline-flex items-center justify-center px-6 py-3 text-[10.5px] font-bold uppercase tracking-[0.18em] text-charcoal transition-colors duration-300"
          style={{ border: `1px solid ${CREAM_DARK}` }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.borderColor = CHARCOAL)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.borderColor = CREAM_DARK)
          }
        >
          Continue shopping
        </button>
      </div>
    </div>
  );
}

function StepRow({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex items-start gap-3 p-4"
      style={{ border: `1px solid ${CREAM_DARK}`, backgroundColor: CREAM }}
    >
      <span
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center text-[10px] font-bold"
        style={{
          border: `1px solid ${CHARCOAL}`,
          color: CHARCOAL,
        }}
      >
        {number}
      </span>
      <div className="flex-1">{children}</div>
    </div>
  );
}