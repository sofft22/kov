/*
# Add subcategory column to products table

## Changes
- products.subcategory (text, nullable) — only used for clothing products
  - Allowed values: 'tops' or 'bottoms' (enforced by CHECK constraint)
  - NULL for non-clothing products

## Notes
- Idempotent: uses ADD COLUMN IF NOT EXISTS
- The CHECK constraint is dropped and recreated to be safe on re-runs
- Existing clothing products get NULL subcategory (admin can set via form)
*/

ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory text;

ALTER TABLE products DROP CONSTRAINT IF EXISTS products_subcategory_check;
ALTER TABLE products ADD CONSTRAINT products_subcategory_check
  CHECK (subcategory IS NULL OR subcategory IN ('tops', 'bottoms'));
