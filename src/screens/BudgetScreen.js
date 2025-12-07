import { ArrowLeft, Plus, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createBudget, deleteBudget, updateBudget } from '../api/budgets';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { CATEGORY_ICONS, DEFAULT_EXPENSE_CATEGORIES } from '../constants/categories';
import { useAuth } from '../contexts/AuthContext';
import { useFilter } from '../contexts/FilterContext';
import { useTheme } from '../contexts/ThemeContext';
import { useBudgets } from '../hooks/useBudgets';
import { useTransactions } from '../hooks/useTransactions';
import { formatCurrency } from '../utils/financeCalculations';

export default function BudgetScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const { selectedDate } = useFilter();
  
  // Use Custom Hooks
  const { budgets, loading: loadingBudgets, refresh: refreshBudgets } = useBudgets(selectedDate);
  const { transactions, loading: loadingTx, refresh: refreshTx } = useTransactions();
  
  const [modalVisible, setModalVisible] = useState(false);
  
  // Form State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [amountLimit, setAmountLimit] = useState('');
  const [editingId, setEditingId] = useState(null);

  const loading = loadingBudgets || loadingTx;

  const getSpentAmount = (category) => {
    const currentMonthTx = transactions.filter(t => {
      const d = new Date(t.date);
      return t.category === category && 
             d.getMonth() === selectedDate.getMonth() && 
             d.getFullYear() === selectedDate.getFullYear() &&
             t.type === 'expense';
    });
    return currentMonthTx.reduce((acc, t) => acc + Number(t.amount), 0);
  };

  // Forecasting Logic
  const getForecast = (spent, limit) => {
    const today = new Date();
    const isCurrentMonth = today.getMonth() === selectedDate.getMonth() && today.getFullYear() === selectedDate.getFullYear();
    
    if (!isCurrentMonth || spent === 0) return null;

    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    
    const dailyAvg = spent / dayOfMonth;
    const projected = dailyAvg * daysInMonth;
    
    if (projected > limit) {
        return {
            projected,
            daysLeft: daysInMonth - dayOfMonth,
            overAmount: projected - limit
        };
    }
    return null;
  };

  const handleSave = async () => {
    if (!selectedCategory || !amountLimit) {
      Alert.alert('Gabim', 'Plotësoni të gjitha fushat');
      return;
    }

    try {
      if (editingId) {
        await updateBudget(editingId, { amount_limit: parseFloat(amountLimit) });
      } else {
        // Check if exists
        const exists = budgets.find(b => b.category === selectedCategory);
        if (exists) {
            Alert.alert('Gabim', 'Buxheti për këtë kategori ekziston tashmë.');
            return;
        }
        await createBudget({
          user_id: user.id,
          category: selectedCategory,
          amount_limit: parseFloat(amountLimit),
          month: selectedDate.toISOString().slice(0, 7)
        });
      }
      setModalVisible(false);
      resetForm();
      refreshBudgets();
    } catch (e) {
      Alert.alert('Gabim', e.message);
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Fshij', 'A jeni i sigurt?', [
      { text: 'Jo', style: 'cancel' },
      { text: 'Po', style: 'destructive', onPress: async () => {
          await deleteBudget(id);
          refreshBudgets();
      }}
    ]);
  };

  const openEdit = (budget) => {
    setEditingId(budget.id);
    setSelectedCategory(budget.category);
    setAmountLimit(String(budget.amount_limit));
    setModalVisible(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedCategory('');
    setAmountLimit('');
  };

  return (
    <ResponsiveContainer>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? colors.background : '#F3F4F6' }]}>
            <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{alignItems:'center'}}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Buxheti Mujor</Text>
            <Text style={{color: colors.textSecondary, fontSize: 12}}>
                {selectedDate.toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
            </Text>
        </View>
        <TouchableOpacity onPress={() => { resetForm(); setModalVisible(true); }} style={{marginLeft: 'auto', padding: 5}}>
            <Plus size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <ScrollView contentContainerStyle={{padding: 20}}>
            {budgets.length === 0 && (
                <Text style={{textAlign:'center', color: colors.textSecondary, marginTop: 50}}>
                    Nuk keni krijuar asnjë buxhet. Shtypni + për të filluar.
                </Text>
            )}

            {budgets.map(b => {
                const spent = getSpentAmount(b.category);
                const limit = Number(b.amount_limit);
                const percent = Math.min(100, (spent / limit) * 100);
                const isOver = spent > limit;
                const forecast = getForecast(spent, limit);
                const Icon = CATEGORY_ICONS[b.category]?.icon || CATEGORY_ICONS['Tjetër'].icon;
                const color = CATEGORY_ICONS[b.category]?.color || '#9CA3AF';

                return (
                    <TouchableOpacity key={b.id} onPress={() => openEdit(b)} onLongPress={() => handleDelete(b.id)} style={[styles.card, { backgroundColor: colors.card }]}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 10}}>
                            <View style={{flexDirection:'row', alignItems:'center', gap: 10}}>
                                <View style={{padding: 8, borderRadius: 20, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F3F4F6'}}>
                                    <Icon size={20} color={color} />
                                </View>
                                <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.text}}>{b.category}</Text>
                            </View>
                            <Text style={{fontSize: 16, fontWeight: 'bold', color: isOver ? '#EF4444' : colors.text}}>
                                {formatCurrency(spent)} / {formatCurrency(limit)} €
                            </Text>
                        </View>
                        
                        <View style={{height: 8, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius: 4, overflow:'hidden'}}>
                            <View style={{width: `${percent}%`, height: '100%', backgroundColor: isOver ? '#EF4444' : color}} />
                        </View>
                        
                        {isOver ? (
                            <Text style={{color: '#EF4444', fontSize: 12, marginTop: 5, fontWeight:'bold'}}>⚠️ Keni tejkaluar buxhetin!</Text>
                        ) : forecast ? (
                            <View style={{flexDirection:'row', alignItems:'center', marginTop: 8, gap: 5}}>
                                <TrendingUp size={14} color="#F59E0B" />
                                <Text style={{color: '#F59E0B', fontSize: 11}}>
                                    Parashikimi: Do ta kaloni me {formatCurrency(forecast.overAmount)}€ nëse vazhdoni kështu.
                                </Text>
                            </View>
                        ) : null}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)'}}>
            <View style={{width:'85%', backgroundColor: colors.card, padding: 20, borderRadius: 16}}>
                <Text style={{fontSize: 18, fontWeight:'bold', color: colors.text, marginBottom: 15}}>
                    {editingId ? 'Ndrysho Buxhetin' : 'Krijo Buxhet'}
                </Text>

                {!editingId && (
                    <>
                        <Text style={{color: colors.textSecondary, marginBottom: 5}}>Kategoria</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                            {DEFAULT_EXPENSE_CATEGORIES.map(cat => (
                                <TouchableOpacity 
                                    key={cat} 
                                    onPress={() => setSelectedCategory(cat)}
                                    style={[
                                        styles.chip, 
                                        { backgroundColor: selectedCategory === cat ? colors.primary : (isDarkMode ? '#374151' : '#F3F4F6') }
                                    ]}
                                >
                                    <Text style={{color: selectedCategory === cat ? 'white' : colors.text}}>{cat}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </>
                )}

                <Text style={{color: colors.textSecondary, marginBottom: 5}}>Limiti Mujor (€)</Text>
                <TextInput 
                    value={amountLimit}
                    onChangeText={(text) => {
                        // Allow only numbers and decimal point
                        if (/^[0-9.]*$/.test(text)) {
                            setAmountLimit(text);
                        } else {
                            Alert.alert('Kujdes', 'Ju lutem shkruani vetëm numra.');
                        }
                    }}
                    keyboardType="numeric"
                    style={{borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, marginBottom: 20, fontSize: 18}}
                    placeholder="0.00"
                    placeholderTextColor={colors.textSecondary}
                />

                <View style={{flexDirection:'row', justifyContent:'flex-end', gap: 10}}>
                    <TouchableOpacity onPress={() => setModalVisible(false)} style={{padding: 10}}>
                        <Text style={{color: colors.textSecondary}}>Anulo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSave} style={{padding: 10, backgroundColor: colors.primary, borderRadius: 8}}>
                        <Text style={{color: 'white', fontWeight:'bold'}}>Ruaj</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </Modal>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1 },
  backBtn: { padding: 8, borderRadius: 20, marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  card: { padding: 15, borderRadius: 16, marginBottom: 15, shadowColor:'#000', shadowOpacity:0.05, elevation: 2 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
});
