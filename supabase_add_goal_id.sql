-- Add goal_id to transactions table to link transactions with goals
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS goal_id bigint REFERENCES public.goals(id) ON DELETE SET NULL;

-- Update RLS policies if necessary (usually not needed for new columns if table policy covers it)
-- But good to ensure we can select it.
