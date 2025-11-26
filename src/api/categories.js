import supabaseClient from '../config/supabase';

export const getCategories = async (userId) => {
  const { data, error } = await supabaseClient
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data;
};

export const createCategory = async (categoryData) => {
  const { data, error } = await supabaseClient
    .from('categories')
    .insert([categoryData])
    .select();

  if (error) throw error;
  return data[0];
};

export const deleteCategory = async (id) => {
  const { error } = await supabaseClient
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
};
