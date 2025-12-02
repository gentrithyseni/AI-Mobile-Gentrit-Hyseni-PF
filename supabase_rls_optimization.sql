-- Optimization for RLS Policies to avoid performance warnings
-- Replacing auth.uid() with (select auth.uid()) prevents re-evaluation for each row.

-- 1. Budgets
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own budgets" ON public.budgets FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING ((select auth.uid()) = user_id);

-- 2. Goals
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;

CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own goals" ON public.goals FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING ((select auth.uid()) = user_id);

-- 3. Categories
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories" ON public.categories FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own categories" ON public.categories FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own categories" ON public.categories FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own categories" ON public.categories FOR DELETE USING ((select auth.uid()) = user_id);
