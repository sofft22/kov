import { useState, type ReactNode } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { BRAND } from '../../config';
import {
  IconDashboard,
  IconOrders,
  IconProducts,
  IconReviews,
  IconCoupons,
  IconSettings,
  IconSignOut,
} from './AdminIcons';

export type AdminPage =
  | 'dashboard'
  | 'orders'
  | 'products'
  | 'reviews'
  | 'coupons'
  | 'settings';

interface Props {
  page: AdminPage;
  onPageChange: (p: AdminPage) => void;
  onExit: () => void;
  children: ReactNode;
  pendingOrders?: number;
  pendingReviews?: number;
}

const NAV = [
  { id: 'dashboard' as const, label: 'Dashboard', Icon: IconDashboard },
  { id: 'orders' as const, label: 'Orders', Icon: IconOrders },
  { id: 'products' as const, label: 'Products', Icon: IconProducts },
  { id: 'coupons' as const, label: 'Coupons', Icon: IconCoupons },
  { id: 'reviews' as const, label: 'Reviews', Icon: IconReviews },
  { id: 'settings' as const, label: 'Settings', Icon: IconSettings },
];

const TAB_IDS: AdminPage[] = ['dashboard', 'orders', 'products', 'reviews'];
const MORE_IDS: AdminPage[] = ['coupons', 'settings'];

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.55)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';

export function AdminLayout({
  page,
  onPageChange,
  onExit,
  children,
  pendingOrders = 0,
  pendingReviews = 0,
}: Props) {
  const { user, signOut } = useAdminAuth();
  const [moreOpen, setMoreOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    onExit();
  };

  const badgeFor = (id: AdminPage) => {
    if (id === 'orders') return pendingOrders;
    if (id === 'reviews') return pendingReviews;
    return 0;
  };

  const moreIsActive = MORE_IDS.includes(page);

  return (
    <div
      className="flex min-h-screen"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* ════════════ DESKTOP SIDEBAR ════════════ */}
<aside
  className="hidden w-[200px] flex-shrink-0 flex-col lg:flex"
  style={{
    borderRight: `1px solid ${CREAM_DARK}`,
    backgroundColor: CREAM,
  }}
>
  {/* Brand */}
  <div className="px-6 py-7">
    <p className="font-serif text-[18px] uppercase leading-none tracking-[0.18em] text-charcoal">
      {BRAND.nameStrong}
      <span style={{ color: TERRACOTTA }}>.</span>
    </p>
    <p
      className="mt-3 text-[10px] font-bold uppercase tracking-[0.28em]"
      style={{ color: TERRACOTTA }}
    >
      Admin
    </p>
  </div>

  {/* Nav */}
  <nav className="flex-1 px-3 py-4">
    <ul className="space-y-0.5">
      {NAV.map(({ id, label }) => {
        const active = page === id;
        const badge = badgeFor(id);
        return (
          <li key={id}>
            <button
              onClick={() => onPageChange(id)}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-[13px] transition-colors duration-200"
              style={{
                backgroundColor: active ? CHARCOAL : 'transparent',
                color: active ? CREAM : MUTED,
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'rgba(26,26,26,0.04)';
                  e.currentTarget.style.color = CHARCOAL;
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = MUTED;
                }
              }}
            >
              <span className="font-medium">{label}</span>
              {badge > 0 && (
                <span
                  className="flex h-[18px] min-w-[18px] items-center justify-center px-1.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: active ? TERRACOTTA : `${TERRACOTTA}1A`,
                    color: active ? CREAM : TERRACOTTA,
                  }}
                >
                  {badge > 99 ? '99+' : badge}
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  </nav>

  {/* User / Sign out */}
  <div
    className="px-6 py-5"
    style={{ borderTop: `1px solid ${CREAM_DARK}` }}
  >
    <p className="truncate text-[11.5px]" style={{ color: MUTED }}>
      {user?.email}
    </p>
    <button
      onClick={handleSignOut}
      className="mt-3 flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
      style={{ color: MUTED }}
      onMouseEnter={(e) => (e.currentTarget.style.color = TERRACOTTA)}
      onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
    >
      <IconSignOut className="h-[14px] w-[14px]" />
      Sign out
    </button>
  </div>
</aside>

      {/* ════════════ MAIN ════════════ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-5 py-3.5 lg:hidden"
          style={{
            borderBottom: `1px solid ${CREAM_DARK}`,
            backgroundColor: CREAM,
          }}
        >
          <span className="w-12" />
          <p className="font-serif text-[16px] uppercase leading-none tracking-[0.18em] text-charcoal">
            {BRAND.nameStrong}
            <span style={{ color: TERRACOTTA }}>.</span>
          </p>
          <button
            onClick={handleSignOut}
            className="w-12 text-right text-[10.5px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
            style={{ color: MUTED }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = TERRACOTTA)
            }
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            Exit
          </button>
        </header>

        <main className="flex-1 pb-24 lg:pb-0">{children}</main>
      </div>

      {/* ════════════ MOBILE BOTTOM NAV ════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden">
        {moreOpen && (
          <div className="absolute bottom-full left-0 right-0 z-50 mb-3 px-3">
            <div
              className="overflow-hidden"
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
                boxShadow: '0 -10px 30px -15px rgba(26,26,26,0.15)',
              }}
            >
              {MORE_IDS.map((id, i) => {
                const item = NAV.find((n) => n.id === id)!;
                const active = page === id;
                return (
                  <button
                    key={id}
                    onClick={() => {
                      onPageChange(id);
                      setMoreOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-5 py-3.5 text-left text-[12.5px] transition-colors duration-200"
                    style={{
                      color: active ? TERRACOTTA : CHARCOAL,
                      borderBottom:
                        i < MORE_IDS.length - 1
                          ? `1px solid ${CREAM_DARK}`
                          : 'none',
                    }}
                  >
                    <item.Icon className="h-[17px] w-[17px]" />
                    <span className="flex-1 font-bold uppercase tracking-[0.12em]">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {moreOpen && (
          <button
            onClick={() => setMoreOpen(false)}
            aria-label="Close menu"
            className="absolute bottom-full left-0 right-0 z-40 h-screen cursor-default bg-black/30"
          />
        )}

        <div
          className="relative flex items-stretch"
          style={{
            borderTop: `1px solid ${CREAM_DARK}`,
            backgroundColor: CREAM,
          }}
        >
          {TAB_IDS.map((id) => {
            const item = NAV.find((n) => n.id === id)!;
            const active = page === id;
            const badge = badgeFor(id);
            return (
              <button
                key={id}
                onClick={() => {
                  onPageChange(id);
                  setMoreOpen(false);
                }}
                aria-label={item.label}
                className="relative flex flex-1 items-center justify-center py-3.5 transition-colors duration-200"
                style={{ color: active ? TERRACOTTA : MUTED }}
              >
                <item.Icon className="h-[20px] w-[20px]" />
                {badge > 0 && (
                  <span
                    className="absolute right-[22%] top-2 flex h-4 min-w-[16px] items-center justify-center px-1 text-[9px] font-bold"
                    style={{
                      backgroundColor: TERRACOTTA,
                      color: CREAM,
                    }}
                  >
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </button>
            );
          })}

          <button
            onClick={() => setMoreOpen((v) => !v)}
            aria-label="More"
            className="relative flex flex-1 items-center justify-center py-3.5 transition-colors duration-200"
            style={{
              color: moreOpen || moreIsActive ? TERRACOTTA : MUTED,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              className="h-[20px] w-[20px]"
            >
              <circle cx="5" cy="12" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="19" cy="12" r="1.5" />
            </svg>
          </button>
        </div>
      </nav>
    </div>
  );
}