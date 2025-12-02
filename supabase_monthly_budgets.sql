-- Add month column to budgets table
ALTER TABLE public.budgets ADD COLUMN IF NOT EXISTS month text;

-- Update existing records to current month (2025-12) so they don't disappear
-- Assuming current date is Dec 2025 based on context
UPDATE public.budgets SET month = to_char(now(), 'YYYY-MM') WHERE month IS NULL;

-- Drop old constraint
ALTER TABLE public.budgets DROP CONSTRAINT IF EXISTS budgets_user_id_category_key;

-- Add new constraint ensuring one budget per category per month
ALTER TABLE public.budgets ADD CONSTRAINT budgets_user_id_category_month_key UNIQUE (user_id, category, month);
