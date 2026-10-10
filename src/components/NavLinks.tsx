import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  variant: 'desktop' | 'mobile';
  onClose?: () => void;
  textColor?: 'white' | 'black';
}

interface NavItem {
  label: string;
  path: string;
}

const NAV: NavItem[] = [
  { label: 'Shop', path: '/shop' },
  { label: 'Clothing', path: '/shop?category=clothing' },
  { label: 'Footwear', path: '/shop?category=footwear' },
  { label: 'Watches', path: '/shop?category=watches' },
  { label: 'Accessories', path: '/shop?category=accessories' },
];

export function NavLinks({ variant, onClose, textColor = 'black' }: Props) {
  const navigate = useNavigate();
  const baseText = textColor === 'white' ? 'text-white' : 'text-charcoal';
  const hoverText = 'hover:text-terracotta';

  const go = (path: string) => {
    onClose?.();
    navigate(path);
  };

  if (variant === 'mobile') {
    return (
      <nav className="flex flex-col">
        {NAV.map((item) => (
          <button
            key={item.label}
            onClick={() => go(item.path)}
            className="flex items-center justify-between border-b border-cream-dark/40 py-5 text-left font-serif text-[20px] tracking-[0.02em] text-charcoal transition-colors hover:text-terracotta"
          >
            {item.label}
          </button>
        ))}
      </nav>
    );
  }

  return (
    <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex lg:gap-9">
      {NAV.map((item) => (
        <button
          key={item.label}
          onClick={() => go(item.path)}
          className={`whitespace-nowrap text-[11.5px] uppercase tracking-[0.16em] ${baseText} transition-colors duration-300 ${hoverText}`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
