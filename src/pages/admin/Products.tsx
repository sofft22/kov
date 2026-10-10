import { useEffect, useMemo, useRef, useState } from 'react';
import { fetchProducts, deleteProduct } from '../../lib/products';
import { formatPrice } from '../../config';
import { CATEGORIES } from '../../config/categories';
import { supabase } from '../../lib/supabase';
import { invalidateProducts } from '../../lib/products-cache';
import type { Product } from '../../types';

interface Props {
  onCreate: () => void;
  onEdit: (p: Product) => void;
}

const LONG_PRESS_MS = 500;

type SortKey = 'manual' | 'newest' | 'name' | 'price';

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CREAM_MAT = '#EFEAE2';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.55)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const GREEN = '#226E3C';
const ERROR = '#B42828';

export function AdminProducts({ onCreate, onEdit }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortKey>('manual');

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [pickedOverId, setPickedOverId] = useState<string | null>(null);
  const longPressTimer = useRef<number | null>(null);
  const touchStartY = useRef<number>(0);
  const listRef = useRef<HTMLDivElement | null>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetchProducts();
    setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  /* Only allow drag reorder when view is unfiltered + custom order */
  const canReorder =
    category === 'all' && query === '' && sort === 'manual';

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== 'all')
      list = list.filter((p) => p.category_id === category);
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category_id.toLowerCase().includes(q)
      );
    }
    switch (sort) {
      case 'manual':
        list.sort((a, b) => {
          const ao = (a as any).sort_order ?? 999999;
          const bo = (b as any).sort_order ?? 999999;
          if (ao !== bo) return ao - bo;
          return (
            new Date((b as any).created_at ?? 0).getTime() -
            new Date((a as any).created_at ?? 0).getTime()
          );
        });
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        list.sort(
          (a, b) =>
            new Date((b as any).created_at ?? 0).getTime() -
            new Date((a as any).created_at ?? 0).getTime()
        );
        break;
    }
    return list;
  }, [products, category, query, sort]);

  const outOfStockCount = products.filter((p) => !p.in_stock).length;

  const handleSingleDelete = async (p: Product) => {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await deleteProduct(p.id);
    await load();
  };

  /* Save new order — only allowed when canReorder is true */
  const persistOrder = async (orderedList: Product[]) => {
    const payloads = orderedList.map((p, i) => ({
      id: p.id,
      sort_order: i,
    }));

    // Sequential updates so we don't hammer Supabase
    for (const row of payloads) {
      await supabase
        .from('products')
        .update({ sort_order: row.sort_order })
        .eq('id', row.id);
    }

    // Clear cache so shop/store refetch fresh order
    invalidateProducts();
  };

  const applyMove = async (fromId: string, toId: string) => {
    if (!fromId || !toId || fromId === toId) return;
    if (!canReorder) return; // safety — drag disabled when filtered/sorted

    const list = [...filtered];
    const fromIdx = list.findIndex((p) => p.id === fromId);
    const toIdx = list.findIndex((p) => p.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;

    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);

    // Optimistic UI
    const reordered = list.map((p, i) => ({
      ...(p as any),
      sort_order: i,
    })) as Product[];

    setProducts(reordered);

    await persistOrder(reordered);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    if (!canReorder) {
      e.preventDefault();
      return;
    }
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent, id: string) => {
    if (!canReorder) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (id !== dragOverId) setDragOverId(id);
  };
  const handleDragEnd = () => {
    if (!canReorder) return;
    const fromId = draggingId;
    const toId = dragOverId;
    setDraggingId(null);
    setDragOverId(null);
    if (fromId && toId) applyMove(fromId, toId);
  };

  const handleTouchStart = (e: React.TouchEvent, id: string) => {
    if (!canReorder) return;
    touchStartY.current = e.touches[0].clientY;
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    longPressTimer.current = window.setTimeout(() => {
      setPickedId(id);
      setPickedOverId(id);
      if (navigator.vibrate) navigator.vibrate(15);
    }, LONG_PRESS_MS);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!canReorder) return;
    if (longPressTimer.current && !pickedId) {
      const dy = Math.abs(e.touches[0].clientY - touchStartY.current);
      if (dy > 5) {
        window.clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }
    if (!pickedId) return;
    e.preventDefault();

    const y = e.touches[0].clientY;
    const rows = listRef.current?.querySelectorAll('[data-product-id]');
    if (!rows) return;
    let targetId: string | null = null;
    rows.forEach((el) => {
      const rect = (el as HTMLElement).getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) {
        targetId = (el as HTMLElement).dataset.productId ?? null;
      }
    });
    if (targetId && targetId !== pickedOverId) setPickedOverId(targetId);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    if (pickedId && pickedOverId && pickedId !== pickedOverId) {
      applyMove(pickedId, pickedOverId);
    }
    setPickedId(null);
    setPickedOverId(null);
  };

  const categoryTabs = useMemo(
    () => [
      { id: 'all', label: 'All' },
      ...CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
    ],
    []
  );

  return (
    <div
      className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10"
      style={{ backgroundColor: CREAM, color: CHARCOAL }}
    >
      {/* ── Header ── */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
            style={{ color: TERRACOTTA }}
          >
            Catalog
          </p>
          <h1 className="mt-2 font-serif text-[26px] leading-none tracking-[-0.02em] text-charcoal sm:text-[30px]">
            Products
          </h1>
          <p className="mt-3 text-[12.5px]" style={{ color: MUTED }}>
            {products.length} total
            {outOfStockCount > 0 && (
              <>
                {' · '}
                <span
                  className="font-bold uppercase tracking-[0.06em]"
                  style={{ color: TERRACOTTA }}
                >
                  {outOfStockCount} out of stock
                </span>
              </>
            )}
          </p>
        </div>

        <button
          onClick={onCreate}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
          style={{ backgroundColor: CHARCOAL, color: CREAM }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = TERRACOTTA)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = CHARCOAL)
          }
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
          Add
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="mb-6" style={{ borderBottom: `1px solid ${CREAM_DARK}` }}>
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3">
          <nav className="no-scrollbar flex flex-1 items-center gap-x-6 overflow-x-auto sm:gap-x-8">
            {categoryTabs.map((c) => {
              const active = category === c.id;
              const count =
                c.id === 'all'
                  ? products.length
                  : products.filter((p) => p.category_id === c.id).length;
              return (
                <button
                  key={c.id}
                  onClick={() => setCategory(c.id)}
                  className="relative shrink-0 pb-3 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-200"
                  style={{ color: active ? CHARCOAL : MUTED }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.color = CHARCOAL;
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.color = MUTED;
                  }}
                >
                  {c.label}
                  <span
                    className="ml-2 font-numbers text-[10.5px]"
                    style={{
                      color: active ? TERRACOTTA : MUTED_SOFT,
                    }}
                  >
                    {count}
                  </span>
                  {active && (
                    <span
                      className="absolute -bottom-[13px] left-0 h-[2px] w-full"
                      style={{ backgroundColor: TERRACOTTA }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2 sm:flex-none">
            <div className="relative w-full max-w-[220px]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2"
                style={{ color: MUTED_SOFT }}
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-3.5-3.5" />
              </svg>
              <input
                type="text"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full py-2 pl-9 pr-3 text-[12.5px] outline-none transition-colors"
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

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="px-3 py-2 text-[11.5px] outline-none transition-colors"
              style={{
                backgroundColor: CREAM,
                border: `1px solid ${CREAM_DARK}`,
                color: CHARCOAL,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = TERRACOTTA)
              }
              onBlur={(e) => (e.currentTarget.style.borderColor = CREAM_DARK)}
            >
              <option value="manual">Custom order</option>
              <option value="newest">Newest</option>
              <option value="name">A–Z</option>
              <option value="price">Price high → low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reorder hint */}
      <p
        className="mb-3 text-[10.5px] font-bold uppercase tracking-[0.16em]"
        style={{ color: canReorder ? MUTED_SOFT : TERRACOTTA }}
      >
        {canReorder
          ? 'Long-press or drag to reorder'
          : 'Reordering is disabled — clear filters and set sort to "Custom order"'}
      </p>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div
            className="h-6 w-6 animate-spin rounded-full border-[2.5px]"
            style={{
              borderColor: CREAM_DARK,
              borderTopColor: TERRACOTTA,
            }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-[12.5px]" style={{ color: MUTED }}>
            {products.length === 0
              ? 'No products yet. Add your first one.'
              : 'No products match.'}
          </p>
        </div>
      ) : (
        <>
          {/* ═══ DESKTOP ═══ */}
          <div className="hidden lg:block">
            <ul>
              {filtered.map((p) => {
                const isDragging = draggingId === p.id;
                const isDragOver = dragOverId === p.id;
                const variantCount = p.variants?.suggested?.length ?? 0;
                return (
                  <li
                    key={p.id}
                    draggable={canReorder}
                    onDragStart={(e) => handleDragStart(e, p.id)}
                    onDragOver={(e) => handleDragOver(e, p.id)}
                    onDragEnd={handleDragEnd}
                    onDrop={(e) => e.preventDefault()}
                    className="group flex items-center gap-4 py-3.5 transition-colors duration-200"
                    style={{
                      borderBottom: `1px solid ${CREAM_DARK}`,
                      borderTop: isDragOver ? `2px solid ${TERRACOTTA}` : 'none',
                      opacity: isDragging ? 0.4 : 1,
                      cursor: canReorder ? 'grab' : 'default',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        'rgba(26,26,26,0.02)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = 'transparent')
                    }
                  >
                    <span
                      className="pl-1 pr-1 transition-colors duration-200"
                      style={{
                        color: MUTED_SOFT,
                        cursor: canReorder ? 'grab' : 'not-allowed',
                        opacity: canReorder ? 1 : 0.35,
                      }}
                      aria-label="Drag to reorder"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <circle cx="9" cy="6" r="1.4" />
                        <circle cx="15" cy="6" r="1.4" />
                        <circle cx="9" cy="12" r="1.4" />
                        <circle cx="15" cy="12" r="1.4" />
                        <circle cx="9" cy="18" r="1.4" />
                        <circle cx="15" cy="18" r="1.4" />
                      </svg>
                    </span>

                    <button
                      onClick={() => onEdit(p)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <div
                        className="relative h-11 w-11 flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: CREAM_MAT }}
                      >
                        {p.image_url && (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-contain"
                          />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12.5px] font-normal uppercase tracking-[0.06em] text-charcoal">
                          {p.name}
                        </p>
                        <p
                          className="mt-1 truncate text-[11px]"
                          style={{ color: MUTED_SOFT }}
                        >
                          <span className="uppercase tracking-[0.06em]">
                            {p.category_id}
                          </span>
                          {variantCount > 0 &&
                            ` · ${variantCount} variant${
                              variantCount === 1 ? '' : 's'
                            }`}
                          {p.badge && ` · ${p.badge}`}
                        </p>
                      </div>
                    </button>

                    <div className="w-[100px] flex-shrink-0 text-right">
                      <p className="font-numbers text-[13px] text-charcoal">
                        {formatPrice(p.price)}
                      </p>
                    </div>

                    <div className="w-[100px] flex-shrink-0">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="h-1.5 w-1.5"
                          style={{
                            backgroundColor: p.in_stock ? GREEN : TERRACOTTA,
                          }}
                        />
                        <span
                          className="text-[10px] font-bold uppercase tracking-[0.14em]"
                          style={{
                            color: p.in_stock ? GREEN : TERRACOTTA,
                          }}
                        >
                          {p.in_stock ? 'In stock' : 'Sold out'}
                        </span>
                      </span>
                    </div>

                    <div className="flex flex-shrink-0 items-center gap-4 pr-1">
                      <button
                        onClick={() => onEdit(p)}
                        className="text-[10.5px] font-bold uppercase tracking-[0.16em] transition-colors duration-200"
                        style={{ color: MUTED }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = TERRACOTTA)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = MUTED)
                        }
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleSingleDelete(p)}
                        aria-label="Delete"
                        className="transition-colors duration-200"
                        style={{ color: MUTED_SOFT }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = ERROR)
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = MUTED_SOFT)
                        }
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.75"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4"
                        >
                          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* ═══ MOBILE ═══ */}
          <div ref={listRef} className="lg:hidden">
            {filtered.map((p) => {
              const isPicked = pickedId === p.id;
              const isPickedOver =
                pickedOverId === p.id && pickedId && pickedId !== p.id;
              return (
                <div
                  key={p.id}
                  data-product-id={p.id}
                  onTouchStart={(e) => handleTouchStart(e, p.id)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="flex items-center gap-3 py-3.5"
                  style={{
                    borderBottom: `1px solid ${CREAM_DARK}`,
                    borderTop: isPickedOver
                      ? `2px solid ${TERRACOTTA}`
                      : 'none',
                    backgroundColor: isPicked
                      ? `${TERRACOTTA}1A`
                      : 'transparent',
                    boxShadow: isPicked
                      ? '0 10px 30px -10px rgba(198,107,79,0.4)'
                      : 'none',
                    touchAction: isPicked ? 'none' : 'pan-y',
                  }}
                >
                  <button
                    onClick={() => !isPicked && onEdit(p)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <div
                      className="relative h-11 w-11 flex-shrink-0 overflow-hidden"
                      style={{ backgroundColor: CREAM_MAT }}
                    >
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-contain"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-normal uppercase tracking-[0.06em] text-charcoal">
                        {p.name}
                      </p>
                      <p
                        className="mt-1 truncate text-[11px] uppercase tracking-[0.06em]"
                        style={{ color: MUTED_SOFT }}
                      >
                        {p.category_id}
                        {p.in_stock === false && ' · Sold out'}
                      </p>
                    </div>
                  </button>
                  <div className="flex flex-shrink-0 items-center gap-3">
                    <p className="font-numbers text-[13px] text-charcoal">
                      {formatPrice(p.price)}
                    </p>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-3.5 w-3.5"
                      style={{ color: MUTED_SOFT }}
                    >
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </div>
                </div>
              );
            })}
            <p
              className="mt-4 text-center text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: canReorder ? MUTED_SOFT : TERRACOTTA }}
            >
              {canReorder
                ? 'Long-press to reorder'
                : 'Clear filters and use "Custom order" to reorder'}
            </p>
          </div>
        </>
      )}
    </div>
  );
}