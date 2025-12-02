-- Comprehensive RLS Optimization Script
-- Replaces auth.uid() with (select auth.uid()) to improve performance by preventing per-row re-evaluation.

-- 1. AI Feedback
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.ai_feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON public.ai_feedback;

CREATE POLICY "Users can insert their own feedback" ON public.ai_feedback FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can view their own feedback" ON public.ai_feedback FOR SELECT USING ((select auth.uid()) = user_id);

-- 2. Budgets
DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

CREATE POLICY "Users can view their own budgets" ON public.budgets FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own budgets" ON public.budgets FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own budgets" ON public.budgets FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own budgets" ON public.budgets FOR DELETE USING ((select auth.uid()) = user_id);

-- 3. Goals
DROP POLICY IF EXISTS "Users can view their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON public.goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON public.goals;

CREATE POLICY "Users can view their own goals" ON public.goals FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own goals" ON public.goals FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own goals" ON public.goals FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own goals" ON public.goals FOR DELETE USING ((select auth.uid()) = user_id);

-- 4. Categories
DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

CREATE POLICY "Users can view their own categories" ON public.categories FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own categories" ON public.categories FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own categories" ON public.categories FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own categories" ON public.categories FOR DELETE USING ((select auth.uid()) = user_id);

-- 5. Transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert their own transactions" ON public.transactions FOR INSERT WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Users can update their own transactions" ON public.transactions FOR UPDATE USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can delete their own transactions" ON public.transactions FOR DELETE USING ((select auth.uid()) = user_id);

-- 6. Profiles
DROP POLICY IF EXISTS "Profiles: select for logged in" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: update own" ON public.profiles;

CREATE POLICY "Profiles: select for logged in" ON public.profiles FOR SELECT USING ((select auth.uid()) = id);
CREATE POLICY "Profiles: insert" ON public.profiles FOR INSERT WITH CHECK ((select auth.uid()) = id);
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);
