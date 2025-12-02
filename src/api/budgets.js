import supabaseClient from '../config/supabase';

export const getBudgets = async (userId, month) => {
  let query = supabaseClient
    .from('budgets')
    .select('*')
    .eq('user_id', userId);

  if (month) {
    query = query.eq('month', month);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
};

export const createBudget = async (budgetData) => {
  const { data, error } = await supabaseClient
    .from('budgets')
    .insert([budgetData])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateBudget = async (id, updates) => {
  const { data, error } = await supabaseClient
    .from('budgets')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteBudget = async (id) => {
  const { error } = await supabaseClient
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
