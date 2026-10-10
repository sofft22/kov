import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES } from '../config/categories';

interface Props {
  variant: 'desktop' | 'mobile';
  onClose?: () => void;
  textColor?: 'white' | 'black';
}

export function NavLinks({ variant, onClose, textColor = 'black' }: Props) {
  const navigate = useNavigate();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);

  const baseText = textColor === 'white' ? 'text-white' : 'text-charcoal';
  const hoverText = 'hover:text-terracotta';
  const isWhite = textColor === 'white';

  const dropdownPanel = isWhite
    ? 'border-white/40 bg-charcoal/30 backdrop-blur-md'
    : 'border-cream-dark bg-cream shadow-[0_20px_40px_-20px_rgba(26,26,26,0.15)]';
  const dropdownItem = isWhite
    ? 'text-white hover:bg-white/10 hover:text-terracotta'
    : 'text-charcoal/80 hover:bg-cream-dark/40 hover:text-terracotta';

  const go = (categoryId: string) => {
    onClose?.();
    setOpenDropdown(null);
    setMobileOpen(null);
    navigate(`/shop?category=${categoryId}`);
  };

  /* ----------------------------------------------------------
     MOBILE
     ---------------------------------------------------------- */
  if (variant === 'mobile') {
    return (
      <nav className="flex flex-col">
        {CATEGORIES.map((item) => {
          const isOpen = mobileOpen === item.id;
          const hasChildren = item.children && item.children.length > 0;

          if (!hasChildren) {
            return (
              <button
                key={item.id}
                onClick={() => go(item.id)}
                className="flex items-center justify-between border-b border-cream-dark/40 py-5 text-left font-serif text-[20px] tracking-[0.02em] text-charcoal transition-colors hover:text-terracotta"
              >
                {item.label}
              </button>
            );
          }

          return (
            <div key={item.id} className="border-b border-cream-dark/40">
              <div className="flex items-center">
                <button
                  onClick={() => go(item.id)}
                  className="flex-1 py-5 text-left font-serif text-[20px] tracking-[0.02em] text-charcoal transition-colors hover:text-terracotta"
                >
                  {item.label}
                </button>
                <button
                  onClick={() =>
                    setMobileOpen((cur) => (cur === item.id ? null : item.id))
                  }
                  aria-label={`Toggle ${item.label} submenu`}
                  className="flex h-10 w-10 items-center justify-center text-charcoal transition-colors hover:text-terracotta"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className={`h-4 w-4 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  >
                    <path
                      d="M6 9l6 6 6-6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              {isOpen && (
                <div className="pb-3 pl-4">
                  {item.children!.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => go(child.id)}
                      className="block w-full py-2.5 text-left text-[14px] tracking-[0.02em] text-charcoal/70 transition-colors hover:text-terracotta"
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  }

  /* ----------------------------------------------------------
     DESKTOP
     ---------------------------------------------------------- */
  return (
    <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex lg:gap-9">
      {CATEGORIES.map((item) => {
        const isOpen = openDropdown === item.id;
        const hasChildren = item.children && item.children.length > 0;

        if (!hasChildren) {
          return (
            <button
              key={item.id}
              onClick={() => go(item.id)}
              className={`whitespace-nowrap text-[11.5px] uppercase tracking-[0.16em] ${baseText} transition-colors duration-300 ${hoverText}`}
            >
              {item.label}
            </button>
          );
        }

        return (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => setOpenDropdown(item.id)}
            onMouseLeave={() => setOpenDropdown(null)}
          >
            <button
              onClick={() => go(item.id)}
              className={`flex items-center gap-1.5 whitespace-nowrap text-[11.5px] uppercase tracking-[0.16em] ${baseText} transition-colors duration-300 ${hoverText}`}
            >
              {item.label}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`h-2.5 w-2.5 transition-transform duration-300 ${
                  isOpen ? 'rotate-180' : ''
                }`}
              >
                <path
                  d="M6 9l6 6 6-6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute left-1/2 top-full z-40 -translate-x-1/2 pt-4">
                <div
                  className={`min-w-[200px] rounded-sm border py-3 ${dropdownPanel}`}
                >
                  {item.children!.map((child) => (
                    <button
                      key={child.id}
                      onClick={() => go(child.id)}
                      className={`block w-full whitespace-nowrap px-6 py-2.5 text-left text-[12.5px] transition-colors duration-200 ${dropdownItem}`}
                    >
                      {child.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}