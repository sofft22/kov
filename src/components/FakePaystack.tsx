import { useState } from 'react';
import { formatPrice } from '../config';

interface Props {
  amount: number;
  email: string;
  onCancel: () => void;
  onSuccess: () => void;
}

type Step = 'card' | 'pin' | 'otp' | 'processing' | 'success';

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.55)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const PAYSTACK_NAVY = '#011B33';

const fieldStyle: React.CSSProperties = {
  backgroundColor: CREAM,
  border: `1px solid ${CREAM_DARK}`,
  color: CHARCOAL,
};

export function FakePaystack({ amount, email, onCancel, onSuccess }: Props) {
  const [step, setStep] = useState<Step>('card');
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const formatExpiry = (v: string) =>
    v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/, '$1/');

  const submitCard = () => {
    if (card.replace(/\s/g, '').length < 16)
      return setError('Enter a valid card number');
    if (expiry.length < 5) return setError('Enter card expiry');
    if (cvv.length < 3) return setError('Enter CVV');
    setError('');
    setStep('pin');
  };

  const submitPin = () => {
    if (pin.length < 4) return setError('Enter your 4-digit PIN');
    setError('');
    setStep('otp');
  };

  const submitOtp = () => {
    if (otp.length < 4) return setError('Enter the OTP sent to your phone');
    setError('');
    setStep('processing');
    setTimeout(() => setStep('success'), 1800);
  };

  const isProcessing = step === 'processing';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center"
      onClick={isProcessing ? undefined : onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex w-full max-w-[440px] flex-col overflow-hidden sm:max-h-[90vh]"
        style={{ backgroundColor: CREAM, color: CHARCOAL }}
      >
        {/* ── Top header — Paystack brand bar ── */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ backgroundColor: PAYSTACK_NAVY }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-6 w-6 items-center justify-center"
              style={{ backgroundColor: '#3BB75E', color: '#FFFFFF' }}
            >
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 3v18M3 12h18" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-white">Paystack</span>
          </div>
          <button
            onClick={onCancel}
            disabled={isProcessing}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center text-white/60 transition-colors duration-300 hover:text-white disabled:opacity-30"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-[16px] w-[16px]"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* ── Test mode ribbon ── */}
        <div
          className="px-6 py-2.5 text-center text-[10px] font-bold uppercase tracking-[0.2em]"
          style={{
            backgroundColor: '#FEF7E0',
            color: '#8A6D00',
            borderBottom: `1px solid ${CREAM_DARK}`,
          }}
        >
          Test Mode · No real charge
        </div>

        {/* ── Amount header ── */}
        <div
          className="px-6 py-6"
          style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
        >
          <div className="flex items-baseline justify-between">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.24em]"
              style={{ color: MUTED_SOFT }}
            >
              Paying
            </p>
            <p
              className="text-[10px] font-bold uppercase tracking-[0.24em]"
              style={{ color: MUTED_SOFT }}
            >
              Secured
            </p>
          </div>
          <p
            className="mt-2 font-numbers text-[28px] leading-none tracking-[-0.02em]"
            style={{ color: CHARCOAL }}
          >
            {formatPrice(amount)}
          </p>
          <p className="mt-2.5 text-[12px]" style={{ color: MUTED }}>
            {email || 'guest@kova.ng'}
          </p>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-7">
          {step === 'card' && (
            <>
              <p className="text-[13px] leading-[1.6]" style={{ color: MUTED }}>
                Enter your card details to pay securely.
              </p>

              <div className="mt-6 space-y-5">
                {/* Card number */}
                <div>
                  <label
                    className="text-[10px] font-bold uppercase tracking-[0.18em]"
                    style={{ color: MUTED }}
                  >
                    Card number
                  </label>
                  <input
                    value={card}
                    onChange={(e) => setCard(formatCard(e.target.value))}
                    placeholder="4084 0840 8408 4081"
                    inputMode="numeric"
                    className="mt-2 w-full px-4 py-3 text-[14px] outline-none transition-colors"
                    style={{ ...fieldStyle, fontFamily: 'ui-monospace, monospace' }}
                    onFocus={(e) =>
                      (e.currentTarget.style.borderColor = TERRACOTTA)
                    }
                    onBlur={(e) =>
                      (e.currentTarget.style.borderColor = CREAM_DARK)
                    }
                  />
                  <div className="mt-2.5 flex gap-1.5">
                    {['Visa', 'Mastercard', 'Verve'].map((b) => (
                      <span
                        key={b}
                        className="px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em]"
                        style={{
                          border: `1px solid ${CREAM_DARK}`,
                          color: MUTED,
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      className="text-[10px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: MUTED }}
                    >
                      Expiry
                    </label>
                    <input
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      inputMode="numeric"
                      className="mt-2 w-full px-4 py-3 text-[14px] outline-none transition-colors"
                      style={{ ...fieldStyle, fontFamily: 'ui-monospace, monospace' }}
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
                      className="text-[10px] font-bold uppercase tracking-[0.18em]"
                      style={{ color: MUTED }}
                    >
                      CVV
                    </label>
                    <input
                      value={cvv}
                      onChange={(e) =>
                        setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))
                      }
                      placeholder="408"
                      inputMode="numeric"
                      className="mt-2 w-full px-4 py-3 text-[14px] outline-none transition-colors"
                      style={{ ...fieldStyle, fontFamily: 'ui-monospace, monospace' }}
                      onFocus={(e) =>
                        (e.currentTarget.style.borderColor = TERRACOTTA)
                      }
                      onBlur={(e) =>
                        (e.currentTarget.style.borderColor = CREAM_DARK)
                      }
                    />
                  </div>
                </div>
              </div>

              {error && (
                <p
                  className="mt-5 px-4 py-3 text-[12px]"
                  style={{
                    backgroundColor: '#FBEDED',
                    color: '#B42828',
                    border: '1px solid rgba(180,40,40,0.2)',
                  }}
                >
                  {error}
                </p>
              )}
            </>
          )}

          {step === 'pin' && (
            <>
              <p className="text-[13px] leading-[1.6]" style={{ color: MUTED }}>
                Enter your 4-digit card PIN to authorize this transaction.
              </p>
              <div className="mt-6">
                <input
                  value={pin}
                  onChange={(e) =>
                    setPin(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="••••"
                  inputMode="numeric"
                  type="password"
                  maxLength={4}
                  className="w-full px-5 py-5 text-center text-[24px] tracking-[0.7em] outline-none transition-colors"
                  style={{ ...fieldStyle, fontFamily: 'ui-monospace, monospace' }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = TERRACOTTA)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = CREAM_DARK)
                  }
                />
              </div>

              {error && (
                <p
                  className="mt-5 px-4 py-3 text-[12px]"
                  style={{
                    backgroundColor: '#FBEDED',
                    color: '#B42828',
                    border: '1px solid rgba(180,40,40,0.2)',
                  }}
                >
                  {error}
                </p>
              )}
            </>
          )}

          {step === 'otp' && (
            <>
              <p className="text-[13px] leading-[1.6]" style={{ color: MUTED }}>
                We sent a 6-digit code to the phone number on file. Enter it below.
              </p>
              <div className="mt-6">
                <input
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))
                  }
                  placeholder="123456"
                  inputMode="numeric"
                  maxLength={6}
                  className="w-full px-5 py-5 text-center text-[24px] tracking-[0.5em] outline-none transition-colors"
                  style={{ ...fieldStyle, fontFamily: 'ui-monospace, monospace' }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = TERRACOTTA)
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.borderColor = CREAM_DARK)
                  }
                />
              </div>
              <p
                className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: MUTED_SOFT }}
              >
                Resend code in 0:28
              </p>

              {error && (
                <p
                  className="mt-5 px-4 py-3 text-[12px]"
                  style={{
                    backgroundColor: '#FBEDED',
                    color: '#B42828',
                    border: '1px solid rgba(180,40,40,0.2)',
                  }}
                >
                  {error}
                </p>
              )}
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-12">
              <div
                className="h-10 w-10 animate-spin rounded-full border-[3px]"
                style={{
                  borderColor: CREAM_DARK,
                  borderTopColor: TERRACOTTA,
                }}
              />
              <p className="mt-7 text-[13px] font-medium" style={{ color: CHARCOAL }}>
                Processing payment…
              </p>
              <p className="mt-2 text-[11px]" style={{ color: MUTED }}>
                Please don't close this window
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center py-8">
              <div
                className="flex h-14 w-14 items-center justify-center"
                style={{
                  backgroundColor: CHARCOAL,
                  color: CREAM,
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="h-7 w-7"
                >
                  <path
                    d="M5 13l4 4L19 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p
                className="mt-7 font-serif text-[22px] leading-tight tracking-[-0.02em]"
                style={{ color: CHARCOAL }}
              >
                Payment successful
              </p>
              <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
                {formatPrice(amount)} has been charged
              </p>
            </div>
          )}
        </div>

        {/* ── Footer — sticky action ── */}
        <div
          className="px-6 py-4"
          style={{
            borderTop: `1px solid ${CREAM_DARK}`,
            backgroundColor: CREAM,
          }}
        >
          {step === 'card' && (
            <button
              onClick={submitCard}
              className="w-full py-4 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-300"
              style={{ backgroundColor: PAYSTACK_NAVY, color: CREAM }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = CHARCOAL)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = PAYSTACK_NAVY)
              }
            >
              Continue
            </button>
          )}

          {step === 'pin' && (
            <div className="space-y-2">
              <button
                onClick={submitPin}
                className="w-full py-4 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-300"
                style={{ backgroundColor: PAYSTACK_NAVY, color: CREAM }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = CHARCOAL)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = PAYSTACK_NAVY)
                }
              >
                Authorize
              </button>
              <button
                onClick={() => {
                  setStep('card');
                  setError('');
                }}
                className="w-full py-2 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                style={{ color: MUTED }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = TERRACOTTA)
                }
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                ← Back
              </button>
            </div>
          )}

          {step === 'otp' && (
            <div className="space-y-2">
              <button
                onClick={submitOtp}
                className="w-full py-4 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-300"
                style={{ backgroundColor: PAYSTACK_NAVY, color: CREAM }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = CHARCOAL)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = PAYSTACK_NAVY)
                }
              >
                Pay {formatPrice(amount)}
              </button>
              <button
                onClick={() => {
                  setStep('pin');
                  setError('');
                }}
                className="w-full py-2 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                style={{ color: MUTED }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = TERRACOTTA)
                }
                onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
              >
                ← Back
              </button>
            </div>
          )}

          {step === 'success' && (
            <button
              onClick={onSuccess}
              className="w-full py-4 text-[11px] font-bold uppercase tracking-[0.22em] transition-colors duration-300"
              style={{ backgroundColor: CHARCOAL, color: CREAM }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = TERRACOTTA)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = CHARCOAL)
              }
            >
              Continue
            </button>
          )}

          {/* Paystack security line */}
          <p
            className="mt-3 text-center text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: MUTED_SOFT }}
          >
            🔒 Secured by Paystack
          </p>
        </div>
      </div>
    </div>
  );
}