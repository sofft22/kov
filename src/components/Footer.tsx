import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BRAND } from '../config';
import { useSettings } from '../context/SettingsContext';
import { ContentModal } from './ContentModal';

type ModalKey = 'about' | 'shipping' | 'returns' | 'privacy' | 'terms' | 'contact' | null;

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';

export function Footer() {
  const { settings } = useSettings();
  const [modal, setModal] = useState<ModalKey>(null);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    const onAbout = () => setModal('about');
    const onContact = () => setModal('contact');
    window.addEventListener('open-modal:about', onAbout);
    window.addEventListener('open-modal:contact', onContact);
    return () => {
      window.removeEventListener('open-modal:about', onAbout);
      window.removeEventListener('open-modal:contact', onContact);
    };
  }, []);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail('');
    setTimeout(() => setSubscribed(false), 3000);
  };

  return (
    <>
      <footer className="bg-cream text-charcoal" role="contentinfo">
        {/* ─── TOP ROW ─── */}
        <div className="mx-auto max-w-7xl px-5 pt-20 pb-14 sm:px-8 sm:pt-24 sm:pb-16 lg:px-10">
          <div className="flex flex-col gap-12 sm:flex-row sm:items-start sm:justify-between sm:gap-16">
            {/* LEFT — Brand */}
            <div className="sm:max-w-[280px]">
              <Link to="/" aria-label="KOVA home">
                <span className="font-serif text-[20px] uppercase leading-none tracking-[0.18em] text-charcoal md:text-[22px]">
                  KOVA
                </span>
              </Link>
              <p className="mt-5 text-[13px] leading-[1.7] text-charcoal/55">
                Considered clothing.
              </p>
            </div>

            {/* RIGHT — Newsletter */}
            <div className="sm:max-w-[400px] sm:text-right">
              <p className="text-[10px] uppercase tracking-[0.32em] text-terracotta">
                Newsletter
              </p>
              <p className="mt-4 font-serif text-[18px] leading-[1.2] tracking-[-0.01em] text-charcoal sm:text-[22px]">
                New drops, restocks, and sales.
              </p>
              <form
                onSubmit={handleSubscribe}
                className="mt-5 flex items-center gap-3 pb-3 transition-colors focus-within:border-charcoal/60 sm:ml-auto sm:max-w-[340px]"
                style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full bg-transparent text-[13.5px] text-charcoal outline-none placeholder:text-charcoal/35 sm:text-left"
                />
                <button
                  type="submit"
                  className="shrink-0 text-[10.5px] font-bold uppercase tracking-[0.2em] text-charcoal transition-colors duration-300"
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = TERRACOTTA)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = CHARCOAL)
                  }
                >
                  {subscribed ? 'Joined ✓' : 'Join →'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* ─── MIDDLE ROW: link columns ─── */}
        <div style={{ borderTop: `1px solid ${CREAM_DARK}` }}>
          <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-10">
            <div className="grid grid-cols-2 gap-x-8 gap-y-12 sm:grid-cols-4 sm:gap-x-6">
              <nav aria-label="Shop">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-charcoal/40">Shop</p>
                <ul className="mt-5 space-y-3 text-[13px]">
  <li><Link to="/shop?category=clothing" className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Clothing</Link></li>
  <li><Link to="/shop?category=footwear" className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Footwear</Link></li>
  <li><Link to="/shop?category=watches" className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Watches</Link></li>
  <li><Link to="/shop?category=accessories" className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Accessories</Link></li>
</ul>
              </nav>

              <nav aria-label="Company">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-charcoal/40">Company</p>
                <ul className="mt-5 space-y-3 text-[13px]">
                  <li><button onClick={() => setModal('about')} className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">About</button></li>
                  <li><button onClick={() => setModal('contact')} className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Contact</button></li>
                </ul>
              </nav>

              <nav aria-label="Help">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-charcoal/40">Help</p>
                <ul className="mt-5 space-y-3 text-[13px]">
                  <li><button onClick={() => setModal('shipping')} className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Shipping</button></li>
                  <li><button onClick={() => setModal('returns')} className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Returns</button></li>
                  <li><button onClick={() => setModal('privacy')} className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Privacy</button></li>
                  <li><button onClick={() => setModal('terms')} className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Terms</button></li>
                </ul>
              </nav>

              <nav aria-label="Connect">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-charcoal/40">Connect</p>
                <ul className="mt-5 space-y-3 text-[13px]">
                  <li><a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer" className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">WhatsApp</a></li>
                  <li><a href={settings.instagram} target="_blank" rel="noreferrer" className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Instagram</a></li>
                  <li><a href={settings.tiktok} target="_blank" rel="noreferrer" className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">TikTok</a></li>
                  <li><a href={`mailto:${settings.email}`} className="text-charcoal/70 transition-colors duration-300 hover:text-terracotta">Email</a></li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        {/* ─── BOTTOM BAR ─── */}
        <div style={{ borderTop: `1px solid ${CREAM_DARK}` }}>
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-5 py-6 sm:flex-row sm:px-8 lg:px-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-charcoal/40">
              © {new Date().getFullYear()} KOVA · All rights reserved
            </p>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-charcoal/40">
              Designed in {BRAND.city}
            </p>
          </div>
        </div>
      </footer>

      {/* ─── MODALS ─── */}

      <ContentModal open={modal === 'about'} onClose={() => setModal(null)} title="About">
        <div className="space-y-5 text-[14.5px] leading-[1.75] text-charcoal/80">
          <p className="text-[16px] font-medium text-charcoal">
            KOVA is a clothing studio based in {BRAND.city}.
          </p>
          <p>
            We started because getting well-made clothes in Nigeria shouldn't
            mean guessing. You shouldn't have to worry about fit, finish, or
            whether the piece will hold up after two washes.
          </p>
          <p>
            Every piece is cut, sewn, and finished in small runs by people we
            know. We work with a handful of tailors, natural fabrics, and
            traditional Nigerian weaves — and we inspect every piece before it
            reaches you.
          </p>
          <p>
            We don't do trends. We do the long run. Pieces you'll wear for
            years, not seasons.
          </p>
          <p className="pt-2 text-[11px] font-bold uppercase tracking-[0.2em] text-terracotta">
            — The KOVA Studio
          </p>
        </div>
      </ContentModal>

      <ContentModal open={modal === 'shipping'} onClose={() => setModal(null)} title="Shipping">
        <div className="space-y-5 text-[14.5px] leading-[1.75] text-charcoal/80">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Delivery in Lagos</h3>
          <p>Orders within Lagos arrive in 1–2 working days. Shipping is calculated at checkout based on your area.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Outside Lagos</h3>
          <p>Nationwide delivery in 2–4 working days via our courier partners.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Free delivery</h3>
          <p>Free Lagos delivery on orders over ₦50,000. Free nationwide over ₦100,000.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Tracking</h3>
          <p>Every order comes with a private tracking link — follow it from placed to delivered.</p>
        </div>
      </ContentModal>

      <ContentModal open={modal === 'returns'} onClose={() => setModal(null)} title="Returns & Refunds">
        <div className="space-y-5 text-[14.5px] leading-[1.75] text-charcoal/80">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Our policy</h3>
          <p>We accept returns within 3 days of delivery, provided the item is unused, unworn, and in original condition with tags attached.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Exceptions</h3>
          <p>Custom-made pieces, bridal, and sale items are final sale.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Damaged or wrong item</h3>
          <p>Message us on WhatsApp within 24 hours of delivery with photos.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Refunds</h3>
          <p>Approved refunds are processed within 3–5 working days to your original payment method.</p>
        </div>
      </ContentModal>

      <ContentModal open={modal === 'privacy'} onClose={() => setModal(null)} title="Privacy">
        <div className="space-y-5 text-[14.5px] leading-[1.75] text-charcoal/80">
          <p>We respect your privacy. Here's what we collect and why:</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">What we collect</h3>
          <p>Your name, phone, email, and delivery address — used only to fulfil your order.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">What we don't do</h3>
          <p>We never sell your data. We never share it with third parties except the courier handling your delivery.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Payment</h3>
          <p>Payments are processed securely. We never store your card details.</p>
        </div>
      </ContentModal>

      <ContentModal open={modal === 'terms'} onClose={() => setModal(null)} title="Terms">
        <div className="space-y-5 text-[14.5px] leading-[1.75] text-charcoal/80">
          <p>By shopping with KOVA, you agree to the following:</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Orders</h3>
          <p>All orders are subject to availability. If an item is out of stock, we'll cancel and refund in full.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Pricing</h3>
          <p>Prices are as displayed at checkout. We may update pricing at any time without notice.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Product images</h3>
          <p>We do our best to show colours and textures accurately. Slight variations may occur due to lighting or device screens.</p>
          <h3 className="pt-3 text-[11px] font-bold uppercase tracking-[0.2em] text-charcoal">Intellectual property</h3>
          <p>All designs, photography, and content on this site belong to KOVA and may not be reproduced without permission.</p>
        </div>
      </ContentModal>

      {/* ─── CONTACT — cleaned, no green blob ─── */}
      <ContentModal open={modal === 'contact'} onClose={() => setModal(null)} title="Contact">
        <div className="space-y-6 text-[14.5px] leading-[1.75] text-charcoal/80">
          <p>We're available <strong className="text-charcoal">Mon–Sat, 10am–6pm</strong>.</p>

          <div className="space-y-3 pt-2">
            <a
              href={`https://wa.me/${settings.whatsapp_number}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 p-4 transition-colors duration-300"
              style={{ border: `1px solid ${CREAM_DARK}`, backgroundColor: CREAM }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{ border: `1px solid ${CHARCOAL}`, color: CHARCOAL }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                  <path d="M19.05 4.91A9.816 9.816 0 0 0 12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01z" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/50">WhatsApp</p>
                <p className="mt-0.5 font-numbers text-[13.5px] text-charcoal">{settings.whatsapp_number}</p>
              </div>
            </a>

            <a
              href={`mailto:${settings.email}`}
              className="flex items-center gap-3 p-4 transition-colors duration-300"
              style={{ border: `1px solid ${CREAM_DARK}`, backgroundColor: CREAM }}
            >
              <span
                className="flex h-9 w-9 items-center justify-center"
                style={{ border: `1px solid ${CHARCOAL}`, color: CHARCOAL }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="h-4 w-4">
                  <rect x="3" y="5" width="18" height="14" />
                  <path d="M21 6l-9 7L3 6" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal/50">Email</p>
                <p className="mt-0.5 text-[13.5px] text-charcoal">{settings.email}</p>
              </div>
            </a>
          </div>
        </div>
      </ContentModal>
    </>
  );
}