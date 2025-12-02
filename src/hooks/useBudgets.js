import { useCallback, useEffect, useState } from 'react';
import { getBudgets } from '../api/budgets';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function useBudgets(selectedDate) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    try {
      const monthStr = selectedDate ? selectedDate.toISOString().slice(0, 7) : null;
      const data = await getBudgets(user.id, monthStr);
      setBudgets(data || []);
    } catch (error) {
      console.error("Error fetching budgets:", error);
      showToast('Gabim gjatë marrjes së buxheteve', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast, selectedDate]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  return {
    budgets,
    loading,
    refresh: fetchBudgets
  };
}
