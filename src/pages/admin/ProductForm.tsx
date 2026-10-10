import { useState, useEffect } from 'react';
import {
  uploadProductImage,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../../lib/products';
import { CATEGORIES, SUBCATEGORIES } from '../../config/categories';
import type { Product } from '../../types';

interface Props {
  product: Product | null;
  onSaved: () => void;
  onCancel: () => void;
}

const BADGES = ['Bestseller', 'New', 'Limited'];

interface Variant {
  label: string;
  priceDelta: number;
}

const CREAM = '#FBF9F5';
const CREAM_DARK = '#EDE8E0';
const CHARCOAL = '#1A1A1A';
const TERRACOTTA = '#C66B4F';
const MUTED = 'rgba(26,26,26,0.55)';
const MUTED_SOFT = 'rgba(26,26,26,0.4)';
const ERROR = '#B42828';

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

export function AdminProductForm({ product, onSaved, onCancel }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [categoryId, setCategoryId] = useState(CATEGORIES[0]?.id ?? 'clothing');
  const [subcategory, setSubcategory] = useState<string>('');
  const [badge, setBadge] = useState('');
  const [inStock, setInStock] = useState(true);
  const [sortOrder, setSortOrder] = useState<string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setDescription(product.description ?? '');
    setPrice(String(product.price));
    setCompareAtPrice(
      product.compare_at_price ? String(product.compare_at_price) : ''
    );
    setCategoryId(product.category_id);
    setSubcategory((product as any).subcategory ?? '');
    setBadge(product.badge ?? '');
    setInStock(product.in_stock);
    setSortOrder(
      (product as any).sort_order != null ? String((product as any).sort_order) : ''
    );
    setImageUrl(product.image_url ?? '');
    setImageUrls(product.image_urls ?? []);
    setVariants(product.variants?.suggested ?? []);
  }, [product]);

  const allImages = [imageUrl, ...imageUrls].filter(Boolean);

  const setImages = (list: string[]) => {
    setImageUrl(list[0] ?? '');
    setImageUrls(list.slice(1));
  };

  const handleImageUpload = async (file: File) => {
    if (allImages.length >= 3) {
      setError('Max 3 images per product');
      return;
    }
    setUploading(true);
    const { url, error } = await uploadProductImage(file);
    setUploading(false);
    if (error || !url) {
      setError(error ?? 'Upload failed');
      return;
    }
    setImages([...allImages, url]);
  };

  const removeImage = (index: number) => {
    const next = allImages.filter((_, i) => i !== index);
    setImages(next);
  };

  const moveImage = (index: number, direction: -1 | 1) => {
    const next = [...allImages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setImages(next);
  };

  const addVariant = () =>
    setVariants((prev) => [...prev, { label: '', priceDelta: 0 }]);

  const updateVariant = (i: number, patch: Partial<Variant>) =>
    setVariants((prev) =>
      prev.map((v, idx) => (idx === i ? { ...v, ...patch } : v))
    );

  const removeVariant = (i: number) =>
    setVariants((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    setError('');
    if (!name.trim()) return setError('Name is required');
    if (!price || Number(price) <= 0) return setError('Valid price is required');
    if (!imageUrl) return setError('Main image is required');

    setSaving(true);
    const payload: Partial<Product> = {
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      compare_at_price: compareAtPrice ? Number(compareAtPrice) : null,
      category_id: categoryId,
      subcategory: (categoryId === 'clothing' && subcategory
        ? subcategory
        : null) as any,
      badge: badge || null,
      in_stock: inStock,
      image_url: imageUrl,
      image_urls: imageUrls.length > 0 ? imageUrls : undefined,
      variants: variants.length > 0 ? { suggested: variants } : undefined,
      sort_order: sortOrder !== '' ? Number(sortOrder) : (null as any),
    };

    const result = product
      ? await updateProduct(product.id, payload)
      : await createProduct(payload);

    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSaved();
  };

  const handleDelete = async () => {
    if (!product) return;
    if (!confirm(`Delete "${product.name}"?`)) return;
    const { error } = await deleteProduct(product.id);
    if (error) {
      setError(error);
      return;
    }
    onSaved();
  };

  const canAddMore = allImages.length < 3;
  const isClothing = categoryId === 'clothing';

  return (
    <div style={{ backgroundColor: CREAM, color: CHARCOAL }}>
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <button
          onClick={onCancel}
          className="mb-6 inline-flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
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
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back to products
        </button>

        <div className="mb-10">
          <p
            className="text-[10.5px] font-bold uppercase tracking-[0.28em]"
            style={{ color: TERRACOTTA }}
          >
            {product ? 'Edit' : 'New'}
          </p>
          <h1 className="mt-3 font-serif text-[28px] leading-tight tracking-[-0.03em] text-charcoal sm:text-[36px]">
            {product ? 'Edit product' : 'New product'}
          </h1>
        </div>

        <div className="space-y-12">
          <section>
            <SectionTitle label="Basics" />
            <div
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              <FormRow
                label="Name"
                value={name}
                onChange={setName}
                placeholder="e.g. Mira Tote"
              />
              <FormRowTextarea
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Short, evocative description."
              />
              <FormRow
                label="Price (₦)"
                value={price}
                onChange={setPrice}
                placeholder="32000"
                type="number"
              />
              <FormRow
                label="Compare at (₦)"
                value={compareAtPrice}
                onChange={setCompareAtPrice}
                placeholder="40000"
                type="number"
                hint="Shows original price slashed next to current price"
                last
              />
            </div>
          </section>

          <section>
            <SectionTitle label="Categorization" />
            <div
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              <FormRowSelect
                label="Category"
                value={categoryId}
                onChange={(v) => {
                  setCategoryId(v);
                  if (v !== 'clothing') setSubcategory('');
                }}
                options={CATEGORIES.map((c) => ({
                  value: c.id,
                  label: c.label,
                }))}
              />

              {isClothing && (
                <FormRowSelect
                  label="Subcategory"
                  value={subcategory}
                  onChange={setSubcategory}
                  options={[
                    { value: '', label: 'None' },
                    ...SUBCATEGORIES.map((s) => ({
                      value: s.id,
                      label: s.label,
                    })),
                  ]}
                />
              )}

              <FormRowSelect
                label="Badge"
                value={badge}
                onChange={setBadge}
                options={[
                  { value: '', label: 'None' },
                  ...BADGES.map((b) => ({ value: b, label: b })),
                ]}
                last
              />
            </div>
          </section>

          <section>
            <SectionTitle label="Stock" />
            <div
              className="flex items-center justify-between gap-4 px-6 py-5"
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              <div className="min-w-0">
                <p className="text-[13px] font-medium text-charcoal">In stock</p>
                <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                  {inStock ? 'Available for purchase' : 'Hidden from sale'}
                </p>
              </div>
              <SquareToggle
                checked={inStock}
                onChange={setInStock}
                label="Toggle stock"
              />
            </div>
          </section>

          <section>
            <SectionTitle label="Display order" />
            <div
              style={{
                border: `1px solid ${CREAM_DARK}`,
                backgroundColor: CREAM,
              }}
            >
              <FormRow
                label="Sort order"
                value={sortOrder}
                onChange={setSortOrder}
                placeholder="e.g. 1, 2, 3…"
                type="number"
                hint="Lower = earlier in Featured. Leave empty to use newest."
                last
              />
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <SectionTitle label="Images" noMargin />
                <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
                  First image is main. Use arrows to reorder.
                </p>
              </div>
              <p
                className="font-numbers text-[11.5px]"
                style={{ color: MUTED_SOFT }}
              >
                {allImages.length} / 3
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {allImages.map((url, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden"
                  style={{
                    border: `1px solid ${CREAM_DARK}`,
                    backgroundColor: CREAM_DARK,
                  }}
                >
                  <img
                    src={url}
                    alt=""
                    className="h-full w-full object-cover"
                  />

                  <button
                    onClick={() => removeImage(i)}
                    aria-label="Remove image"
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center transition-colors duration-200"
                    style={{ backgroundColor: CREAM, color: CHARCOAL }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = TERRACOTTA)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = CHARCOAL)
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
                      <path d="M6 6l12 12M18 6L6 18" />
                    </svg>
                  </button>

                  {i === 0 && (
                    <span
                      className="absolute bottom-2 left-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em]"
                      style={{ backgroundColor: CHARCOAL, color: CREAM }}
                    >
                      Main
                    </span>
                  )}

                  {allImages.length > 1 && (
                    <div className="absolute bottom-2 right-2 flex gap-1">
                      {i > 0 && (
                        <button
                          onClick={() => moveImage(i, -1)}
                          aria-label="Move left"
                          className="flex h-7 w-7 items-center justify-center transition-colors duration-200"
                          style={{ backgroundColor: CREAM, color: CHARCOAL }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = TERRACOTTA)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = CHARCOAL)
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
                            <path d="M15 18l-6-6 6-6" />
                          </svg>
                        </button>
                      )}
                      {i < allImages.length - 1 && (
                        <button
                          onClick={() => moveImage(i, 1)}
                          aria-label="Move right"
                          className="flex h-7 w-7 items-center justify-center transition-colors duration-200"
                          style={{ backgroundColor: CREAM, color: CHARCOAL }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.color = TERRACOTTA)
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.color = CHARCOAL)
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
                            <path d="M9 6l6 6-6 6" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {canAddMore && (
                <label
                  className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors duration-200"
                  style={{
                    border: `1px dashed ${CREAM_DARK}`,
                    color: MUTED,
                    backgroundColor: CREAM,
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
                  {uploading ? (
                    <div
                      className="h-6 w-6 animate-spin rounded-full border-[2.5px]"
                      style={{
                        borderColor: CREAM_DARK,
                        borderTopColor: TERRACOTTA,
                      }}
                    />
                  ) : (
                    <>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        className="h-5 w-5"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                      Add
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between">
              <div>
                <SectionTitle label="Variants" noMargin />
                <p className="mt-2 text-[12px]" style={{ color: MUTED }}>
                  Optional. Sizes, shades, or pack options.
                </p>
              </div>
              <button
                onClick={addVariant}
                className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.18em] transition-colors duration-300"
                style={{ color: CHARCOAL }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = TERRACOTTA)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = CHARCOAL)
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

            {variants.length === 0 ? (
              <div
                className="px-6 py-8 text-center"
                style={{
                  border: `1px dashed ${CREAM_DARK}`,
                  backgroundColor: CREAM,
                }}
              >
                <p className="text-[12.5px]" style={{ color: MUTED }}>
                  No variants — single price.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {variants.map((v, i) => (
                  <div
                    key={i}
                    className="p-5"
                    style={{
                      border: `1px solid ${CREAM_DARK}`,
                      backgroundColor: CREAM,
                    }}
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_160px]">
                      <div>
                        <label
                          className="mb-2 block text-[10.5px] font-bold uppercase tracking-[0.18em]"
                          style={{ color: MUTED }}
                        >
                          Label
                        </label>
                        <input
                          value={v.label}
                          onChange={(e) =>
                            updateVariant(i, { label: e.target.value })
                          }
                          placeholder="e.g. Size M"
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
                          + Price (₦)
                        </label>
                        <input
                          type="number"
                          value={v.priceDelta}
                          onChange={(e) =>
                            updateVariant(i, {
                              priceDelta: Number(e.target.value),
                            })
                          }
                          placeholder="0"
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
                    <button
                      onClick={() => removeVariant(i)}
                      className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] underline-offset-4 transition-colors duration-300 hover:underline"
                      style={{ color: ERROR }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {error && (
            <p
              className="px-6 py-4 text-[12.5px] font-medium"
              style={{
                backgroundColor: '#FBEDED',
                color: ERROR,
                border: `1px solid ${ERROR}33`,
              }}
            >
              {error}
            </p>
          )}

          <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-center sm:justify-end">
            {product && (
              <button
                onClick={handleDelete}
                className="order-2 text-[10.5px] font-bold uppercase tracking-[0.18em] underline-offset-4 transition-colors duration-300 hover:underline sm:order-1 sm:mr-auto"
                style={{ color: ERROR }}
              >
                Delete product
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || uploading}
              className="order-1 py-4 text-[11.5px] font-bold uppercase tracking-[0.22em] transition-colors duration-300 disabled:opacity-60 sm:order-2 sm:px-10"
              style={{ backgroundColor: CHARCOAL, color: CREAM }}
              onMouseEnter={(e) => {
                if (!saving && !uploading)
                  e.currentTarget.style.backgroundColor = TERRACOTTA;
              }}
              onMouseLeave={(e) => {
                if (!saving && !uploading)
                  e.currentTarget.style.backgroundColor = CHARCOAL;
              }}
            >
              {saving ? 'Saving…' : product ? 'Save changes' : 'Create product'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({
  label,
  noMargin,
}: {
  label: string;
  noMargin?: boolean;
}) {
  return (
    <h2
      className={`text-[10.5px] font-bold uppercase tracking-[0.28em] ${
        noMargin ? '' : 'mb-5'
      }`}
      style={{ color: TERRACOTTA }}
    >
      {label}
    </h2>
  );
}

function FormRow({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  hint,
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  hint?: string;
  last?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6"
      style={{ borderBottom: last ? 'none' : `1px solid ${CREAM_DARK}` }}
    >
      <div>
        <label
          className="block text-[10.5px] font-bold uppercase tracking-[0.18em]"
          style={{ color: MUTED }}
        >
          {label}
        </label>
        {hint && (
          <p className="mt-1.5 text-[11px]" style={{ color: MUTED_SOFT }}>
            {hint}
          </p>
        )}
      </div>
      <input
        type={type}
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

function FormRowTextarea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div
      className="grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-start sm:gap-6"
      style={{ borderBottom: `1px solid ${CREAM_DARK}` }}
    >
      <label
        className="text-[10.5px] font-bold uppercase tracking-[0.18em] sm:pt-2"
        style={{ color: MUTED }}
      >
        {label}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-1.5 text-[13.5px] font-medium outline-none transition-colors sm:text-right"
        style={{
          backgroundColor: 'transparent',
          border: `1px solid transparent`,
          color: CHARCOAL,
          resize: 'vertical',
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

function FormRowSelect({
  label,
  value,
  onChange,
  options,
  last,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  last?: boolean;
}) {
  return (
    <div
      className="grid grid-cols-1 gap-2 px-6 py-5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-6"
      style={{ borderBottom: last ? 'none' : `1px solid ${CREAM_DARK}` }}
    >
      <label
        className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
        style={{ color: MUTED }}
      >
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full py-1 text-[13.5px] font-medium outline-none sm:text-right"
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: CHARCOAL,
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SquareToggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      aria-label={label}
      className="relative flex h-6 w-11 flex-shrink-0 items-center transition-colors duration-300"
      style={{
        backgroundColor: checked ? CHARCOAL : 'rgba(26,26,26,0.15)',
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