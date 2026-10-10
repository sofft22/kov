import { useCart } from '../context/CartContext';
import { formatPrice } from '../config';

interface Props {
  onCheckout: () => void;
}

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CREAM_MAT = '#EFEAE2';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';

export function CartDrawer({ onCheckout }: Props) {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    subtotal,
    totalItems,
  } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={closeCart}>
      <div className="absolute inset-0 bg-black/50" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-[420px] flex-col"
        style={{ backgroundColor: CREAM, color: CHARCOAL }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
        >
          <h2
            className="text-[11.5px] font-bold uppercase tracking-[0.18em]"
            style={{ color: CHARCOAL }}
          >
            Your bag {totalItems > 0 && `· ${totalItems}`}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center transition-opacity duration-300 hover:opacity-60"
            style={{ color: CHARCOAL }}
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

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 p-8 text-center">
            <p
              className="text-[13px]"
              style={{ color: 'rgba(26,26,26,0.5)' }}
            >
              Your bag is empty
            </p>
            <button
              onClick={closeCart}
              className="px-7 py-3 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
              style={{ backgroundColor: CHARCOAL, color: CREAM }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = TERRACOTTA)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = CHARCOAL)
              }
            >
              Continue shopping
            </button>
          </div>
        ) : (
          <>
            {/* ── Items ── */}
            <div className="flex-1 overflow-y-auto px-6 py-7">
              <div className="space-y-6">
                {items.map((item) => {
                  const linePrice =
                    item.product.price + (item.variantPriceDelta ?? 0);
                  const key = `${item.product.id}::${item.variant ?? ''}`;

                  return (
                    <div
                      key={key}
                      className="flex gap-4 pb-6 last:border-0"
                      style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
                    >
                      <div
                        className="h-20 w-20 flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: CREAM_MAT }}
                      >
                        {item.product.image_url && (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4
                          className="text-[12px] font-medium uppercase tracking-[0.06em]"
                          style={{ color: CHARCOAL }}
                        >
                          {item.product.name}
                        </h4>

                        {item.variant && (
                          <p
                            className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.08em]"
                            style={{ color: 'rgba(26,26,26,0.5)' }}
                          >
                            {item.variant}
                          </p>
                        )}

                        <p
                          className="mt-2 text-[12.5px]"
                          style={{ color: CHARCOAL }}
                        >
                          {formatPrice(linePrice)}
                        </p>

                        <div className="mt-3 flex items-center justify-between">
                          {/* Quantity — square, no pill */}
                          <div
                            className="inline-flex items-stretch"
                            style={{ border: `1px solid ${CREAM_DARK}` }}
                          >
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                  item.variant
                                )
                              }
                              aria-label="Decrease quantity"
                              className="flex h-8 w-8 items-center justify-center transition-colors duration-200"
                              style={{ color: CHARCOAL }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  CREAM_DARK)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  'transparent')
                              }
                            >
                              −
                            </button>
                            <span
                              className="flex h-8 w-8 items-center justify-center text-[12px] font-medium"
                              style={{
                                color: CHARCOAL,
                                borderLeft: `1px solid ${CREAM_DARK}`,
                                borderRight: `1px solid ${CREAM_DARK}`,
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                  item.variant
                                )
                              }
                              aria-label="Increase quantity"
                              className="flex h-8 w-8 items-center justify-center transition-colors duration-200"
                              style={{ color: CHARCOAL }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  CREAM_DARK)
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor =
                                  'transparent')
                              }
                            >
                              +
                            </button>
                          </div>

                          <button
                            onClick={() =>
                              removeFromCart(item.product.id, item.variant)
                            }
                            className="text-[10px] font-bold uppercase tracking-[0.16em] transition-colors duration-300"
                            style={{ color: 'rgba(26,26,26,0.5)' }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = TERRACOTTA)
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color =
                                'rgba(26,26,26,0.5)')
                            }
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Footer ── */}
            <div
              className="px-6 py-6"
              style={{ borderTop: `1px solid ${CREAM_DARK}` }}
            >
              <div className="mb-5 flex items-center justify-between">
                <span
                  className="text-[11px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: 'rgba(26,26,26,0.5)' }}
                >
                  Subtotal
                </span>
                <span
                  className="text-[16px] font-medium"
                  style={{ color: CHARCOAL }}
                >
                  {formatPrice(subtotal)}
                </span>
              </div>

              <button
                onClick={() => {
                  closeCart();
                  onCheckout();
                }}
                className="w-full py-4 text-center text-[11.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                style={{ backgroundColor: CHARCOAL, color: CREAM }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor = TERRACOTTA)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor = CHARCOAL)
                }
              >
                Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}