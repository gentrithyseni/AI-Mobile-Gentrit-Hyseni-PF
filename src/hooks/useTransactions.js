import { useCallback, useEffect, useState } from 'react';
import { getTransactions } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export function useTransactions() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getTransactions(user.id);
      // Sort by date descending
      const sorted = (data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(sorted);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      showToast('Gabim gjatë marrjes së transaksioneve', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, showToast]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    loading,
    refreshing,
    refresh,
    setTransactions // Exposed for optimistic updates if needed
  };
}
