import supabaseClient from '../config/supabase';

export const getGoals = async (userId) => {
  const { data, error } = await supabaseClient
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
};

export const createGoal = async (goalData) => {
  const { data, error } = await supabaseClient
    .from('goals')
    .insert([goalData])
    .select();

  if (error) throw error;
  return data[0];
};

export const updateGoal = async (id, updates) => {
  const { data, error } = await supabaseClient
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteGoal = async (id) => {
  const { error } = await supabaseClient
    .from('goals')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
