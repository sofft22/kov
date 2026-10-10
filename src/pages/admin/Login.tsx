import { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { BRAND } from '../../config';

interface Props {
  onSuccess: () => void;
}

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.5)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const MUTED_ON_DARK = 'rgba(251,249,245,0.5)';
const MUTED_SOFT_ON_DARK = 'rgba(251,249,245,0.35)';

export function AdminLogin({ onSuccess }: Props) {
  const { signIn } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError('Invalid email or password');
      return;
    }
    onSuccess();
  };

  return (
    <div
      className="flex min-h-screen flex-col md:flex-row"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* ══════════ DARK BRAND PANEL ══════════ */}
      <div
        className="relative flex-shrink-0 overflow-hidden px-7 py-10 md:flex md:flex-1 md:flex-col md:justify-between md:p-14"
        style={{ backgroundColor: CHARCOAL }}
      >
        {/* Subtle warm glow */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.08]">
          <div
            className="absolute -left-20 top-20 h-96 w-96 rounded-full blur-3xl"
            style={{ backgroundColor: TERRACOTTA }}
          />
          <div
            className="absolute bottom-0 right-0 h-96 w-96 rounded-full blur-3xl"
            style={{ backgroundColor: TERRACOTTA }}
          />
        </div>

        {/* Brand mark */}
        <div className="relative z-10">
          <p
            className="font-serif text-[26px] uppercase leading-none tracking-[0.18em] md:text-[34px]"
            style={{ color: CREAM }}
          >
            {BRAND.name}
          </p>
          <p
            className="mt-3 text-[10px] font-bold uppercase tracking-[0.32em] md:mt-4 md:text-[10.5px]"
            style={{ color: MUTED_ON_DARK }}
          >
            Admin
          </p>
        </div>

        {/* Hero line */}
        <div className="relative z-10 mt-8 md:mt-0">
          <div
            className="mb-5 h-px w-16 md:mb-7"
            style={{ backgroundColor: 'rgba(251,249,245,0.25)' }}
          />
          <h1
            className="max-w-md font-serif text-[38px] italic leading-[1.05] tracking-[-0.03em] md:text-[52px]"
            style={{ color: CREAM }}
          >
            Manage
            <br />
            your store.
          </h1>
        </div>

        <p
          className="relative z-10 mt-8 hidden text-[10px] font-bold uppercase tracking-[0.28em] md:block"
          style={{ color: MUTED_SOFT_ON_DARK }}
        >
          © {new Date().getFullYear()} {BRAND.name}
        </p>
      </div>

      {/* ══════════ CREAM FORM PANEL ══════════ */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 md:w-[520px] md:flex-none md:py-16">
        <div className="w-full max-w-sm">
          <p
            className="text-[10px] font-bold uppercase tracking-[0.32em]"
            style={{ color: MUTED_SOFT }}
          >
            Welcome back
          </p>
          <h2
            className="mt-4 font-serif text-[32px] leading-[1.05] tracking-[-0.03em] md:mt-5 md:text-[40px]"
            style={{ color: CHARCOAL }}
          >
            Sign in
            <br />
            to continue.
          </h2>

          <form
            onSubmit={handleSubmit}
            className="mt-10 space-y-5 md:mt-12 md:space-y-6"
          >
            {/* Email */}
            <div>
              <label
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: MUTED }}
              >
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@kova.ng"
                className="mt-2.5 w-full px-5 py-4 text-[14px] font-medium outline-none transition-colors md:text-[14.5px]"
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

            {/* Password */}
            <div>
              <label
                className="text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: MUTED }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="mt-2.5 w-full px-5 py-4 text-[14px] font-medium outline-none transition-colors md:text-[14.5px]"
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

            {error && (
              <p
                className="px-5 py-3.5 text-[12px] font-medium"
                style={{
                  backgroundColor: '#FBEDED',
                  color: '#B42828',
                  border: '1px solid rgba(180,40,40,0.15)',
                }}
              >
                {error}
              </p>
            )}

            {/* Submit — black, square */}
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full py-4 text-center text-[11.5px] font-bold uppercase tracking-[0.24em] transition-colors duration-300 disabled:opacity-60 md:mt-5 md:py-4.5"
              style={{ backgroundColor: CHARCOAL, color: CREAM }}
              onMouseEnter={(e) => {
                if (!loading)
                  e.currentTarget.style.backgroundColor = TERRACOTTA;
              }}
              onMouseLeave={(e) => {
                if (!loading)
                  e.currentTarget.style.backgroundColor = CHARCOAL;
              }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p
            className="mt-10 text-center text-[11px] font-bold uppercase tracking-[0.18em] md:mt-12"
            style={{ color: MUTED_SOFT }}
          >
            Only authorised accounts
          </p>
        </div>
      </div>
    </div>
  );
}