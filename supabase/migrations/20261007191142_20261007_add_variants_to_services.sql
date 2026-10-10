/*
# Add variants column to services table

The services table was created in a prior migration without a `variants` column.
The app's TypeScript `Service` type includes an optional `variants` field
(ServiceVariant[]), and the storefront's fetchPublicServices function reads
`row.variants` if present. This adds the column so the schema fully supports
the type.

## Changes
- services.variants (jsonb, nullable) — service variant options
*/

ALTER TABLE services ADD COLUMN IF NOT EXISTS variants jsonb;
