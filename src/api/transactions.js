import supabaseClient from '../config/supabase';

export async function getTransactions(userId) {
  // Optimizim: Zgjedhim vetëm kolonat e nevojshme në vend të '*'
  const { data, error } = await supabaseClient
    .from('transactions')
    .select('id, amount, category, description, date, type, user_id, goal_id')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createTransaction(tx) {
  const { data, error } = await supabaseClient.from('transactions').insert([tx]).select();
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function updateTransaction(id, changes) {
  const { data, error } = await supabaseClient.from('transactions').update(changes).eq('id', id).select();
  if (error) throw error;
  return data?.[0] ?? null;
}

export async function deleteTransaction(id) {
  // 1. Get the transaction first to check for goal_id
  const { data: transaction, error: fetchError } = await supabaseClient
    .from('transactions')
    .select('amount, goal_id')
    .eq('id', id)
    .single();

  if (transaction && transaction.goal_id) {
    // 2. Get the goal
    const { data: goal, error: goalError } = await supabaseClient
      .from('goals')
      .select('current_amount')
      .eq('id', transaction.goal_id)
      .single();
    
    if (goal) {
      // 3. Update the goal
      const newAmount = Number(goal.current_amount) - Number(transaction.amount);
      await supabaseClient
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', transaction.goal_id);
    }
  }

  const { error } = await supabaseClient.from('transactions').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function getTransactionsByFilter(filters = {}) {
  let query = supabaseClient.from('transactions').select('*');
  if (filters.userId) query = query.eq('user_id', filters.userId);
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.startDate) query = query.gte('date', filters.startDate);
  if (filters.endDate) query = query.lte('date', filters.endDate);
  if (filters.minAmount) query = query.gte('amount', filters.minAmount);
  if (filters.maxAmount) query = query.lte('amount', filters.maxAmount);
  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return data || [];
}
