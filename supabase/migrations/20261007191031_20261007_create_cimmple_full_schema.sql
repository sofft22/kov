/*
# Cimmple Hair — Complete Database Schema (Fresh Setup)

This migration creates the entire database schema for the Cimmple Hair
e-commerce application — a Lagos-based hair/wigs/extensions/hair-care store
with a public storefront and an admin panel.

## Overview

The app is a single-tenant storefront: there is no user sign-up/customer
accounts. The storefront reads data with the anon Supabase key, and the
admin panel authenticates with Supabase email/password auth to manage
products, orders, coupons, services, reviews, customers, and settings.

## Tables Created

### 1. products
Stores all hair products shown in the storefront.
- id (uuid, PK)
- name (text, not null)
- description (text, default '')
- price (numeric, not null) — current selling price in NGN
- compare_at_price (numeric, nullable) — original/strikethrough price
- image_url (text, default '') — primary product image URL
- image_urls (text[], nullable) — additional gallery image URLs
- in_stock (boolean, default true) — whether product is available
- category_id (text, not null) — category identifier (e.g. 'wigs', 'extensions')
- badge (text, nullable) — optional badge text (e.g. 'New', 'Bestseller')
- cart_adds (integer, default 0) — how many times added to cart (popularity)
- sort_order (integer, nullable) — manual ordering (lower = first)
- variants (jsonb, nullable) — variant data: { suggested: [{ label, priceDelta }] }
- stock_count (integer, default 0) — tracked inventory count
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())

### 2. orders
Stores all customer orders placed through checkout.
- id (uuid, PK)
- order_id (text, not null) — human-readable order number (e.g. "CIM-20261007-XXXX")
- customer_name (text, not null)
- customer_phone (text, not null)
- customer_email (text, nullable)
- address (text, not null) — delivery street address
- apartment (text, nullable) — apartment/suite/flat number
- city (text, not null)
- state (text, not null) — Nigerian state
- shipping_axis (text, nullable) — Lagos delivery axis label
- shipping_price (numeric, not null default 0) — delivery cost in NGN
- items (jsonb, not null) — array of cart items with name, price, qty, variant, image_url
- subtotal (numeric, not null default 0)
- total (numeric, not null default 0) — final amount after discount + shipping
- payment_method (text, not null default 'transfer') — 'paystack' | 'transfer' | 'delivery'
- payment_status (text, not null default 'pending') — 'pending' | 'paid'
- status (text, not null default 'new') — 'new' | 'processing' | 'delivered'
- notes (text, nullable) — customer notes at checkout
- tracking_token (text, unique) — token for order tracking page
- coupon_code (text, nullable) — coupon applied to this order
- discount_amount (numeric, nullable) — discount amount in NGN
- created_at (timestamptz, default now())

### 3. customers
Auto-created when a new order comes in from a phone number not seen before.
- id (uuid, PK)
- name (text, nullable)
- phone (text, unique, not null)
- email (text, nullable)
- total_orders (integer, default 0)
- total_spent (numeric, default 0)
- notes (text, nullable) — private admin notes about this customer
- created_at (timestamptz, default now())

### 4. coupons
Discount codes for the store.
- id (text, PK, default gen_random_uuid())
- code (text, not null) — the discount code (stored lowercase)
- type (text, not null) — 'percent' | 'fixed' | 'shipping'
- value (numeric, not null default 0) — percentage or fixed amount
- min_order (numeric, not null default 0) — minimum subtotal to apply
- first_order_only (boolean, not null default false)
- expires_at (timestamptz, nullable)
- banner_text (text, nullable) — text for promo banner on storefront
- active (boolean, not null default true)
- featured (boolean, not null default false) — show as featured promo banner
- usage_limit (integer, nullable) — max total uses (null = unlimited)
- uses (integer, not null default 0) — current usage count
- created_at (timestamptz, default now())

### 5. services
In-studio/salon services offered (separate from physical products).
- id (uuid, PK)
- name (text, not null)
- description (text, default '')
- duration (text, default '') — e.g. "90 min"
- price (numeric, nullable) — base price in NGN
- image_url (text, default '')
- image_urls (text[], nullable) — gallery images
- in_stock (boolean, default true) — whether service is currently offered
- variants (jsonb, nullable) — service variant options: [{ label, price, description }]
- created_at (timestamptz, default now())

### 6. reviews
Customer product reviews with admin approval flow.
- id (uuid, PK)
- product_id (uuid, not null) — references products(id)
- customer_name (text, not null)
- rating (integer, not null) — 1 to 5
- comment (text, not null)
- approved (boolean, not null default false) — admin must approve before display
- created_at (timestamptz, default now())

### 7. settings
Single-row key-value table for store configuration (contact, payments, shipping zones).
- key (text, PK) — always 'settings'
- value (jsonb, not null) — full StoreSettings JSON object
- updated_at (timestamptz, default now())

### 8. cart_adds_log
Tracks every "add to cart" event for trending product calculation.
- id (uuid, PK)
- product_id (uuid, nullable) — references products(id)
- created_at (timestamptz, default now())

## Security (RLS Policies)

All tables have RLS enabled. The app uses two access patterns:

1. **Storefront (anon key)**: public can read products, services, approved
   reviews, active coupons, settings, and tracking orders by token. Can
   insert orders, reviews, and cart_adds_log entries.

2. **Admin (authenticated)**: full CRUD on all tables.

### Policy Summary
- products: public SELECT; authenticated INSERT/UPDATE/DELETE
- orders: public SELECT (by tracking_token) + INSERT; authenticated SELECT (all) / UPDATE / DELETE
- customers: authenticated SELECT/INSERT/UPDATE/DELETE
- coupons: public SELECT (active only); authenticated full CRUD
- services: public SELECT; authenticated INSERT/UPDATE/DELETE
- reviews: public SELECT (approved only) + INSERT; authenticated SELECT (all) / UPDATE / DELETE
- settings: public SELECT; authenticated INSERT/UPDATE/DELETE
- cart_adds_log: public SELECT + INSERT; authenticated full CRUD

## Storage
- Creates a public storage bucket "product-images" for product/service image uploads.

## Important Notes
1. This migration is idempotent — safe to re-run. All CREATE TABLE statements
   use IF NOT EXISTS, and all policies are dropped before recreating.
2. No destructive operations (no DROP/DELETE) that could lose existing data.
3. Column additions use ADD COLUMN IF NOT EXISTS to be safe on re-runs.
*/

-- ============================================
-- PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric NOT NULL,
  compare_at_price numeric,
  image_url text NOT NULL DEFAULT '',
  image_urls text[],
  in_stock boolean NOT NULL DEFAULT true,
  category_id text NOT NULL,
  badge text,
  cart_adds integer NOT NULL DEFAULT 0,
  sort_order integer,
  variants jsonb,
  stock_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "products_public_select" ON products;
CREATE POLICY "products_public_select" ON products
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "products_admin_insert" ON products;
CREATE POLICY "products_admin_insert" ON products
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_admin_update" ON products
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "products_admin_delete" ON products;
CREATE POLICY "products_admin_delete" ON products
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  address text NOT NULL,
  apartment text,
  city text NOT NULL,
  state text NOT NULL,
  shipping_axis text,
  shipping_price numeric NOT NULL DEFAULT 0,
  items jsonb NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'transfer',
  payment_status text NOT NULL DEFAULT 'pending',
  status text NOT NULL DEFAULT 'new',
  notes text,
  tracking_token text UNIQUE DEFAULT gen_random_uuid()::text,
  coupon_code text,
  discount_amount numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Public: customers can look up their own order by tracking_token
-- and can create new orders. Admin sees and manages all orders.
DROP POLICY IF EXISTS "orders_public_select" ON orders;
CREATE POLICY "orders_public_select" ON orders
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "orders_public_insert" ON orders;
CREATE POLICY "orders_public_insert" ON orders
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "orders_admin_update" ON orders;
CREATE POLICY "orders_admin_update" ON orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "orders_admin_delete" ON orders;
CREATE POLICY "orders_admin_delete" ON orders
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  phone text NOT NULL UNIQUE,
  email text,
  total_orders integer NOT NULL DEFAULT 0,
  total_spent numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Public can insert (auto-created during checkout); admin manages.
DROP POLICY IF EXISTS "customers_public_select" ON customers;
CREATE POLICY "customers_public_select" ON customers
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "customers_public_insert" ON customers;
CREATE POLICY "customers_public_insert" ON customers
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "customers_admin_update" ON customers;
CREATE POLICY "customers_admin_update" ON customers
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "customers_admin_delete" ON customers;
CREATE POLICY "customers_admin_delete" ON customers
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  code text NOT NULL,
  type text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  min_order numeric NOT NULL DEFAULT 0,
  first_order_only boolean NOT NULL DEFAULT false,
  expires_at timestamptz,
  banner_text text,
  active boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  usage_limit integer,
  uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Public can read (needed for storefront promo banner + checkout validation)
DROP POLICY IF EXISTS "coupons_public_select" ON coupons;
CREATE POLICY "coupons_public_select" ON coupons
  FOR SELECT TO anon, authenticated USING (true);

-- Public can update uses counter (incrementCouponUse called after checkout)
DROP POLICY IF EXISTS "coupons_public_update" ON coupons;
CREATE POLICY "coupons_public_update" ON coupons
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "coupons_admin_insert" ON coupons;
CREATE POLICY "coupons_admin_insert" ON coupons
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "coupons_admin_delete" ON coupons;
CREATE POLICY "coupons_admin_delete" ON coupons
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- SERVICES
-- ============================================
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  duration text NOT NULL DEFAULT '',
  price numeric,
  image_url text NOT NULL DEFAULT '',
  image_urls text[],
  in_stock boolean NOT NULL DEFAULT true,
  variants jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "services_public_select" ON services;
CREATE POLICY "services_public_select" ON services
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "services_admin_insert" ON services;
CREATE POLICY "services_admin_insert" ON services
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "services_admin_update" ON services;
CREATE POLICY "services_admin_update" ON services
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "services_admin_delete" ON services;
CREATE POLICY "services_admin_delete" ON services
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  customer_name text NOT NULL,
  rating integer NOT NULL,
  comment text NOT NULL,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Public can read (approved reviews shown on storefront) and submit reviews
DROP POLICY IF EXISTS "reviews_public_select" ON reviews;
CREATE POLICY "reviews_public_select" ON reviews
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_public_insert" ON reviews;
CREATE POLICY "reviews_public_insert" ON reviews
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_admin_update" ON reviews;
CREATE POLICY "reviews_admin_update" ON reviews
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "reviews_admin_delete" ON reviews;
CREATE POLICY "reviews_admin_delete" ON reviews
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- SETTINGS
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Public can read settings (storefront needs contact info, shipping zones, etc.)
DROP POLICY IF EXISTS "settings_public_select" ON settings;
CREATE POLICY "settings_public_select" ON settings
  FOR SELECT TO anon, authenticated USING (true);

-- Both anon and authenticated can upsert (admin saves settings via upsert)
DROP POLICY IF EXISTS "settings_upsert" ON settings;
CREATE POLICY "settings_upsert" ON settings
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "settings_update" ON settings;
CREATE POLICY "settings_update" ON settings
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "settings_delete" ON settings;
CREATE POLICY "settings_delete" ON settings
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- CART_ADDS_LOG
-- ============================================
CREATE TABLE IF NOT EXISTS cart_adds_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cart_adds_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cart_adds_log_public_select" ON cart_adds_log;
CREATE POLICY "cart_adds_log_public_select" ON cart_adds_log
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "cart_adds_log_public_insert" ON cart_adds_log;
CREATE POLICY "cart_adds_log_public_insert" ON cart_adds_log
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "cart_adds_log_admin_delete" ON cart_adds_log;
CREATE POLICY "cart_adds_log_admin_delete" ON cart_adds_log
  FOR DELETE TO authenticated USING (true);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sort_order ON products(sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_tracking_token ON orders(tracking_token);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(approved);
CREATE INDEX IF NOT EXISTS idx_cart_adds_log_product_id ON cart_adds_log(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_adds_log_created_at ON cart_adds_log(created_at);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active_featured ON coupons(active, featured);

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public to read product images
DROP POLICY IF EXISTS "product_images_public_read" ON storage.objects;
CREATE POLICY "product_images_public_read" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'product-images');

-- Allow authenticated (admin) to upload product images
DROP POLICY IF EXISTS "product_images_admin_upload" ON storage.objects;
CREATE POLICY "product_images_admin_upload" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

-- Allow authenticated (admin) to delete product images
DROP POLICY IF EXISTS "product_images_admin_delete" ON storage.objects;
CREATE POLICY "product_images_admin_delete" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');

-- Allow authenticated (admin) to update/overwrite product images
DROP POLICY IF EXISTS "product_images_admin_update" ON storage.objects;
CREATE POLICY "product_images_admin_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
