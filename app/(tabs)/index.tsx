import { useAuth } from '@/contexts/AuthContext';
import type { SupabaseClient } from '@supabase/supabase-js';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const supabaseClient = require('@/config/supabase').default;

const FOREST_GREEN = '#2d5016';
const LIGHT_GRAY = '#f5f5f5';

// Type definitions
interface Transaction {
  id: string;
  user_id: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  created_at?: string;
  updated_at?: string;
}

const supabase: SupabaseClient = supabaseClient as SupabaseClient;

const confirmDeletion = (onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    const confirmFn = typeof globalThis !== 'undefined' && typeof globalThis.confirm === 'function'
      ? globalThis.confirm.bind(globalThis)
      : undefined;

    if (!confirmFn || confirmFn('Delete transaction?')) {
      onConfirm();
    }
    return;
  }

  Alert.alert('Delete?', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
};

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editAmount, setEditAmount] = useState('');
  const [editType, setEditType] = useState<'income' | 'expense'>('expense');

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('[home] Error loading transactions:', error);
        setTransactions([]);
      } else {
        console.log('[home] Transactions loaded:', data?.length || 0);
        setTransactions((data as Transaction[]) || []);
      }
    } catch (e) {
      console.error('[home] Exception loading transactions:', e);
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const addTransaction = async () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isNaN(parseFloat(amount))) {
      Alert.alert('Error', 'Amount must be a number');
      return;
    }

    setIsAdding(true);
    try {
      console.log('[home] Adding transaction:', { description, amount, type });
      const { data, error } = await supabase.from('transactions').insert({
        user_id: user.id,
        description: description.trim(),
        amount: parseFloat(amount),
        type: type,
        created_at: new Date().toISOString(),
      }).select();

      if (error) {
        console.error('[home] Insert error:', error);
        Alert.alert('Error', error.message || 'Failed to add transaction');
      } else {
        console.log('[home] Transaction added:', data);
        Alert.alert('Success', 'Transaction added!');
        setDescription('');
        setAmount('');
        await loadTransactions();
      }
    } catch (e) {
      console.error('[home] Exception:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to add transaction';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsAdding(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      console.log('[home] Deleting transaction:', id);
      
      // First verify the transaction exists and belongs to current user
      const { data: verify } = await supabase
        .from('transactions')
        .select('id')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!verify) {
        Alert.alert('Error', 'Transaction not found or does not belong to you');
        console.log('[home] Transaction verification failed');
        return;
      }

      const { data, error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('[home] Delete error:', error);
        Alert.alert('Error', error.message || 'Failed to delete');
      } else {
        console.log('[home] Transaction deleted successfully:', data);
        Alert.alert('Success', 'Transaction deleted');
        await loadTransactions();
      }
    } catch (e) {
      console.error('[home] Delete exception:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to delete transaction';
      Alert.alert('Error', errorMessage);
    }
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingId(transaction.id);
    setEditDescription(transaction.description);
    setEditAmount(transaction.amount.toString());
    setEditType(transaction.type);
    setIsEditModalVisible(true);
  };

  const updateTransaction = async () => {
    if (!editDescription.trim() || !editAmount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (isNaN(parseFloat(editAmount))) {
      Alert.alert('Error', 'Amount must be a number');
      return;
    }

    try {
      if (!editingId) return;
      console.log('[home] Updating transaction:', editingId);
      const { error } = await supabase
        .from('transactions')
        .update({
          description: editDescription.trim(),
          amount: parseFloat(editAmount),
          type: editType,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingId);

      if (error) {
        console.error('[home] Update error:', error);
        Alert.alert('Error', error.message || 'Failed to update transaction');
      } else {
        console.log('[home] Transaction updated');
        Alert.alert('Success', 'Transaction updated!');
        setIsEditModalVisible(false);
        await loadTransactions();
      }
    } catch (e) {
      console.error('[home] Update exception:', e);
      const errorMessage = e instanceof Error ? e.message : 'Failed to update transaction';
      Alert.alert('Error', errorMessage);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert('Signed Out', 'You have been signed out');
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to sign out';
      Alert.alert('Error', 'Failed to sign out: ' + errorMessage);
    }
  };

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const balance = totalIncome - totalExpenses;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 20 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Personal Finance</Text>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={[styles.summaryCard, { backgroundColor: '#e8f5e9' }]}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={styles.summaryAmount}>${totalIncome.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#ffebee' }]}>
          <Text style={styles.summaryLabel}>Expenses</Text>
          <Text style={styles.summaryAmount}>${totalExpenses.toFixed(2)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: '#e3f2fd' }]}>
          <Text style={styles.summaryLabel}>Balance</Text>
          <Text style={[styles.summaryAmount, { color: balance >= 0 ? '#2d5016' : '#c62828' }]}>
            ${balance.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Add Transaction Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Add Transaction</Text>

        {/* Type Selector */}
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]}
            onPress={() => setType('expense')}
          >
            <Text style={[styles.typeBtnText, type === 'expense' && styles.typeBtnTextActive]}>
              Expense
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.typeBtnActive]}
            onPress={() => setType('income')}
          >
            <Text style={[styles.typeBtnText, type === 'income' && styles.typeBtnTextActive]}>
              Income
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Description"
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
        />

        <TextInput
          style={styles.input}
          placeholder="Amount"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        <TouchableOpacity 
          style={[styles.addBtn, isAdding && styles.addBtnDisabled]} 
          onPress={addTransaction}
          disabled={isAdding}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>{isAdding ? 'Adding...' : 'Add Transaction'}</Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Transactions</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading...</Text>
        ) : transactions.length === 0 ? (
          <Text style={styles.emptyText}>No transactions yet</Text>
        ) : (
          <FlatList
            data={transactions}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.transactionItem}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionDesc}>{item.description}</Text>
                  <Text style={styles.transactionType}>{item.type === 'income' ? '📈 Income' : '📉 Expense'}</Text>
                </View>
                <View style={styles.transactionAmount}>
                  <Text style={[styles.amount, { color: item.type === 'income' ? '#2d5016' : '#c62828' }]}>
                    {item.type === 'income' ? '+' : '-'}${item.amount?.toFixed(2)}
                  </Text>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditModal(item)}
                  >
                    <Text style={styles.editBtnText}>✎</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDeletion(() => deleteTransaction(item.id))}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Edit Modal */}
      {isEditModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Transaction</Text>

            {/* Type Selector */}
            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[styles.typeBtn, editType === 'expense' && styles.typeBtnActive]}
                onPress={() => setEditType('expense')}
              >
                <Text style={[styles.typeBtnText, editType === 'expense' && styles.typeBtnTextActive]}>
                  Expense
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, editType === 'income' && styles.typeBtnActive]}
                onPress={() => setEditType('income')}
              >
                <Text style={[styles.typeBtnText, editType === 'income' && styles.typeBtnTextActive]}>
                  Income
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Description"
              placeholderTextColor="#999"
              value={editDescription}
              onChangeText={setEditDescription}
            />

            <TextInput
              style={styles.input}
              placeholder="Amount"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
              value={editAmount}
              onChangeText={setEditAmount}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.saveBtnStyle]} 
                onPress={updateTransaction}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnText}>Save</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelBtnStyle]} 
                onPress={() => setIsEditModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: FOREST_GREEN,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  signOutBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  signOutText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: FOREST_GREEN,
  },
  formContainer: {
    backgroundColor: LIGHT_GRAY,
    margin: 12,
    padding: 16,
    borderRadius: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: FOREST_GREEN,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#ddd',
    alignItems: 'center',
  },
  typeBtnActive: {
    backgroundColor: FOREST_GREEN,
  },
  typeBtnText: {
    color: '#666',
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#ffffff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#ffffff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 6,
    fontSize: 14,
  },
  addBtn: {
    backgroundColor: FOREST_GREEN,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  addBtnDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.6,
  },
  addBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContainer: {
    padding: 12,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: FOREST_GREEN,
  },
  loadingText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
  transactionItem: {
    backgroundColor: LIGHT_GRAY,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  transactionType: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  transactionAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  editBtn: {
    backgroundColor: '#e3f2fd',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: '#ffebee',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 16,
    color: '#c62828',
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: FOREST_GREEN,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  saveBtnStyle: {
    backgroundColor: FOREST_GREEN,
  },
  cancelBtnStyle: {
    backgroundColor: '#999999',
  },
  modalBtnText: {
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
