import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, Clock, Plus, Save, Trash2 } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createCategory, deleteCategory, getCategories } from '../api/categories';
import { getGoals, updateGoal } from '../api/goals';
import { createTransaction, deleteTransaction, updateTransaction } from '../api/transactions';
import CalculatorKeypad from '../components/CalculatorKeypad';
import { CATEGORY_ICONS, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from '../constants/categories';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { evaluateExpression } from '../utils/financeCalculations';

export default function AddTransactionScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [showKeypad, setShowKeypad] = useState(false);
  
  // Marrim transaksionin nëse po vijmë për editim
  const transactionToEdit = route.params?.transaction;
  const isEditing = !!transactionToEdit;

  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [mode, setMode] = useState('date');

  const [customCategories, setCustomCategories] = useState([]);
  const [goals, setGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { control, handleSubmit, setValue } = useForm({ 
    defaultValues: { 
      amount: '', 
      category: '', 
      notes: '' 
    } 
  });
  
  const [type, setType] = useState('expense');

  useEffect(() => {
    if (user) {
        getCategories(user.id).then(cats => setCustomCategories(cats || []));
        getGoals(user.id).then(g => setGoals(g || []));
    }
  }, [user]);

  // Mbushim formën nëse jemi duke edituar
  useEffect(() => {
    if (isEditing) {
      setValue('amount', String(transactionToEdit.amount));
      setValue('category', transactionToEdit.category);
      setValue('notes', transactionToEdit.description || '');

      if (DEFAULT_INCOME_CATEGORIES.includes(transactionToEdit.category) || transactionToEdit.type === 'income') {
        setType('income');
      } else {
        setType('expense');
      }
      setDate(new Date(transactionToEdit.date));
    }
  }, [transactionToEdit, isEditing, setValue]);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShowDatePicker(true);
    setMode(currentMode);
  };

  const activeCats = useMemo(() => {
    const defaults = type === 'expense' ? DEFAULT_EXPENSE_CATEGORIES : DEFAULT_INCOME_CATEGORIES;
    const customs = customCategories.filter(c => c.type === type).map(c => c.name);
    return [...defaults, ...customs];
  }, [type, customCategories]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
        const newCat = await createCategory({
            user_id: user.id,
            name: newCategoryName,
            type: type,
            icon: 'Circle',
            color: '#808080'
        });
        setCustomCategories([...customCategories, newCat]);
        setNewCategoryName('');
        setShowModal(false);
    } catch (e) {
        alert('Gabim: ' + e.message);
    }
  };

  const handleCategoryLongPress = async (catName) => {
      // Check if it's a custom category
      const customCat = customCategories.find(c => c.name === catName);
      if (!customCat) {
          Alert.alert("Info", "Kategoritë e parazgjedhura nuk mund të fshihen.");
          return;
      }

      Alert.alert(
          "Fshij Kategorinë",
          `A jeni i sigurt që doni të fshini kategorinë "${catName}"?`,
          [
              { text: "Anulo", style: "cancel" },
              { 
                  text: "Fshij", 
                  style: 'destructive',
                  onPress: async () => {
                      try {
                          await deleteCategory(customCat.id);
                          setCustomCategories(prev => prev.filter(c => c.id !== customCat.id));
                      } catch (e) {
                          alert("Gabim: " + e.message);
                      }
                  }
              }
          ]
      );
  };

  const onSubmit = async (values) => {
    if (!values.category) {
      alert('Ju lutem zgjidhni një kategori!');
      return;
    }

    try {
      // Evaluate math expression in amount (e.g. "10-3.5")
      // Note: Calculation is also done onBlur, but we double check here
      const calculatedAmount = evaluateExpression(values.amount);
      const finalAmount = parseFloat(calculatedAmount);

      if (isNaN(finalAmount)) {
        alert('Shuma nuk është valide!');
        return;
      }

      if (finalAmount < 0) {
        alert('Shuma nuk mund të jetë negative!');
        return;
      }

      const txData = {
        user_id: user?.id,
        amount: finalAmount,
        type: type,
        category: type === 'income' ? (values.category === 'Ushqim' ? 'Income' : values.category) : values.category,
        description: values.notes || 'Pa përshkrim',
        date: date.toISOString(),
      };

      if (isEditing) {
        await updateTransaction(transactionToEdit.id, txData);
        
        // Handle Goal Update on Edit
        // Note: Since we don't track which goal was originally selected in the transaction table,
        // we can only update the goal if the user selects one NOW.
        // Ideally, we should store goal_id in transactions table to reverse the old amount.
        // For now, we will just add the difference if the user selects a goal.
        if (selectedGoalId) {
             const goal = goals.find(g => g.id === selectedGoalId);
             if (goal) {
                 // If we assume the user is correcting the SAME transaction for the SAME goal:
                 // New Goal Amount = Old Goal Amount - Old Transaction Amount + New Transaction Amount
                 // But we don't know if it was linked to this goal before.
                 // So we will just add the new amount to the goal, assuming it wasn't tracked before or user wants to add it now.
                 // To do this properly, we need a schema change to add goal_id to transactions.
                 
                 // Current workaround: Just add the amount to the goal as if it's new contribution
                 // This is what the user asked for: "kur e ndryshova... shuma nuk ndryshoi"
                 // So we will update it now.
                 
                 // However, if we just add it, we might double count if we don't subtract the old one.
                 // Since we can't subtract the old one (don't know which goal), we will just add the difference 
                 // between new amount and old amount IF the user explicitly selects the goal again.
                 
                 const difference = finalAmount - Number(transactionToEdit.amount);
                 // Only update if there is a difference and it makes sense
                 if (difference !== 0) {
                    const newGoalAmount = Number(goal.current_amount) + difference;
                    await updateGoal(selectedGoalId, { current_amount: newGoalAmount });
                 }
             }
        }

      } else {
        await createTransaction(txData);
        
        // Update Goal if selected
        if (selectedGoalId) {
            const goal = goals.find(g => g.id === selectedGoalId);
            if (goal) {
                const newAmount = Number(goal.current_amount) + finalAmount;
                await updateGoal(selectedGoalId, { current_amount: newAmount });
            }
        }
      }
      
      navigation.goBack();
    } catch (e) {
      console.error("Gabim:", e);
      alert('Gabim: ' + (e.message || e.toString()));
    }
  };

  const handleDelete = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("A jeni i sigurt që doni ta fshini këtë transaksion?");
      if (confirmed) {
        try {
          await deleteTransaction(transactionToEdit.id);
          navigation.goBack();
        } catch (e) {
          console.error(e);
          alert("Gabim gjatë fshirjes: " + e.message);
        }
      }
      return;
    }

    Alert.alert(
      "Fshij Transaksionin",
      "A jeni i sigurt?",
      [
        { text: "Jo", style: "cancel" },
        { 
          text: "Po, Fshije", 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transactionToEdit.id);
              navigation.goBack();
            } catch (_e) {
              alert("Gabim gjatë fshirjes");
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? colors.background : '#F3F4F6' }]}>
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Ndrysho Transaksion' : 'Shto Transaksion'}</Text>
            
            {/* Butoni Fshij shfaqet vetëm kur jemi duke edituar */}
            {isEditing && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Trash2 size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
        </View>

        <ScrollView contentContainerStyle={{padding: 20}}>
            <View style={[styles.switchContainer, { backgroundColor: colors.border }]}
>
                <TouchableOpacity onPress={() => setType('expense')} style={[styles.switchBtn, type === 'expense' && { backgroundColor: colors.card }]}>
                    <Text style={[styles.switchText, { color: colors.textSecondary }, type === 'expense' && { color: colors.text }]}>Shpenzim</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setType('income')} style={[styles.switchBtn, type === 'income' && { backgroundColor: colors.card }]}>
                    <Text style={[styles.switchText, { color: colors.textSecondary }, type === 'income' && { color: colors.text }]}>Të Ardhura</Text>
                </TouchableOpacity>
            </View>

            <Text style={[styles.label, { color: colors.textSecondary }]}>Shuma (€)</Text>
            <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                <View>
                  <TextInput 
                      showSoftInputOnFocus={false}
                      onFocus={() => {
                          Keyboard.dismiss();
                          setShowKeypad(true);
                      }}
                      style={[styles.inputLarge, { color: colors.text, borderColor: colors.border }]} 
                      placeholder="0.00" 
                      placeholderTextColor={colors.textSecondary}
                      value={value} 
                      // Disable manual typing since we use custom keypad
                      editable={true}
                  />
                  
                  <Text style={{color: colors.textSecondary, fontSize: 12, marginTop: 4}}>
                    Mund të shkruani llogaritje (psh. 50+20-5)
                  </Text>
                </View>
                )}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Kategoria</Text>
            {!selectedGoalId && (
            <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                <View style={{flexDirection:'row', flexWrap:'wrap', gap: 10, marginBottom: 20}}>
                    {activeCats.map(cat => {
                        const IconComponent = CATEGORY_ICONS[cat]?.icon || CATEGORY_ICONS['Tjetër'].icon;
                        const iconColor = CATEGORY_ICONS[cat]?.color || CATEGORY_ICONS['Tjetër'].color;
                        const isSelected = value === cat;

                        return (
                        <TouchableOpacity 
                            key={cat} 
                            onPress={() => {
                                if (isSelected) {
                                    onChange('');
                                } else {
                                    onChange(cat);
                                }
                            }}
                            onLongPress={() => handleCategoryLongPress(cat)}
                            style={[
                                styles.chip, 
                                { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 6 }, 
                                isSelected && { backgroundColor: colors.primary }
                            ]}
                        >
                            <IconComponent size={16} color={isSelected ? 'white' : iconColor} />
                            <Text style={[styles.chipText, { color: colors.text }, isSelected && { color: 'white' }]}>{cat}</Text>
                        </TouchableOpacity>
                        );
                    })}
                    
                    <TouchableOpacity 
                        onPress={() => setShowModal(true)}
                        style={[styles.chip, { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', gap: 6, borderStyle: 'dashed', borderWidth: 1, borderColor: colors.textSecondary }]
}>
                        <Plus size={16} color={colors.textSecondary} />
                        <Text style={[styles.chipText, { color: colors.textSecondary }]}>Shto</Text>
                    </TouchableOpacity>
                </View>
                )}
            />
            )}

            {/* Goals Selection Section - Only for Expenses */}
            {type === 'expense' && goals.length > 0 && (
                <View style={{marginBottom: 20}}>
                    <Text style={[styles.label, { color: colors.textSecondary }]}>
                        {isEditing ? 'Përditëso Qëllimin (Opsionale)' : 'Lidhe me një Qëllim'}
                    </Text>
                    {isEditing && (
                        <Text style={{color: colors.textSecondary, fontSize: 12, marginBottom: 5}}>
                            * Zgjidhni përsëri qëllimin për të përditësuar progresin
                        </Text>
                    )}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <TouchableOpacity 
                            onPress={() => {
                                setSelectedGoalId(null);
                                setValue('category', ''); // Reset category when goal is deselected
                            }}
                            style={[
                                styles.chip, 
                                { backgroundColor: colors.card, marginRight: 10, borderWidth: 1, borderColor: selectedGoalId === null ? colors.primary : 'transparent' }
                            ]}
                        >
                            <Text style={[styles.chipText, { color: colors.text }]}>Asnjë</Text>
                        </TouchableOpacity>
                        
                        {goals.map(goal => (
                            <TouchableOpacity 
                                key={goal.id} 
                                onPress={() => {
                                    const newId = goal.id === selectedGoalId ? null : goal.id;
                                    setSelectedGoalId(newId);
                                    // If selecting a goal, set it as the category. If deselecting, clear category.
                                    setValue('category', newId ? goal.title : '');
                                }}
                                style={[
                                    styles.chip, 
                                    { backgroundColor: colors.card, marginRight: 10, flexDirection: 'row', alignItems: 'center', gap: 5 },
                                    selectedGoalId === goal.id && { backgroundColor: colors.primary }
                                ]}
                            >
                                <Text>{goal.icon}</Text>
                                <Text style={[styles.chipText, { color: selectedGoalId === goal.id ? 'white' : colors.text }]}>{goal.title}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}

            <Text style={[styles.label, { color: colors.textSecondary }]}>Data dhe Koha</Text>
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
                <TouchableOpacity 
                    onPress={() => showMode('date')}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card }}
                >
                    <Calendar size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={{ color: colors.text }}>{date.toLocaleDateString()}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    onPress={() => showMode('time')}
                    style={{ flex: 1, flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: colors.border, borderRadius: 12, backgroundColor: colors.card }}
                >
                    <Clock size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
                    <Text style={{ color: colors.text }}>{date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                </TouchableOpacity>
            </View>

            {showDatePicker && (
                <DateTimePicker
                    testID="dateTimePicker"
                    value={date}
                    mode={mode}
                    is24Hour={true}
                    onChange={onChangeDate}
                />
            )}

            <Text style={[styles.label, { color: colors.textSecondary }]}>Përshkrimi / Shënime</Text>
            <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                  placeholder="Shkruaj ketu... " 
                  placeholderTextColor={colors.textSecondary}
                  value={value} 
                  onChangeText={onChange} 
                />
                )}
            />

            <TouchableOpacity onPress={handleSubmit(onSubmit)} style={[styles.saveBtn, { backgroundColor: colors.primary }]}
>
                <Save size={20} color="white" style={{marginRight:8}} />
                <Text style={styles.saveBtnText}>{isEditing ? 'Përditëso' : 'Ruaj Transaksionin'}</Text>
            </TouchableOpacity>
        </ScrollView>

        <Modal visible={showModal} transparent animationType="slide">
            <View style={{flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'rgba(0,0,0,0.5)'}}>
                <View style={{width:'80%', backgroundColor: colors.card, padding: 20, borderRadius: 16}}>
                    <Text style={{fontSize:18, fontWeight:'bold', color: colors.text, marginBottom: 15}}>Shto Kategori të Re</Text>
                    <TextInput 
                        value={newCategoryName}
                        onChangeText={setNewCategoryName}
                        placeholder="Emri i kategorisë"
                        placeholderTextColor={colors.textSecondary}
                        style={{borderWidth:1, borderColor: colors.border, borderRadius: 8, padding: 10, color: colors.text, marginBottom: 20}}
                    />
                    <View style={{flexDirection:'row', justifyContent:'flex-end', gap: 10}}>
                        <TouchableOpacity onPress={() => setShowModal(false)} style={{padding: 10}}>
                            <Text style={{color: colors.textSecondary}}>Anulo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={handleAddCategory} style={{padding: 10, backgroundColor: colors.primary, borderRadius: 8}}>
                            <Text style={{color: 'white', fontWeight:'bold'}}>Shto</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        {/* Custom Calculator Keypad */}
        {showKeypad && (
            <CalculatorKeypad 
                onKeyPress={(key) => {
                    const currentVal = control._formValues.amount || '';
                    const lastChar = currentVal.slice(-1);
                    const isOperator = ['+', '-', '*', '/'].includes(key);
                    const isLastOperator = ['+', '-', '*', '/'].includes(lastChar);

                    if (isOperator && isLastOperator) {
                        // Replace the last operator with the new one
                        setValue('amount', currentVal.slice(0, -1) + key);
                    } else {
                        setValue('amount', currentVal + key);
                    }
                }}
                onDelete={() => {
                    const currentVal = control._formValues.amount || '';
                    setValue('amount', currentVal.slice(0, -1));
                }}
                onSubmit={() => {
                    // Calculate on Done
                    const currentVal = control._formValues.amount || '';
                    const calculated = evaluateExpression(currentVal);
                    if (parseFloat(calculated) < 0) {
                        Alert.alert("Gabim", "Shuma nuk mund të jetë negative");
                        setValue('amount', "");
                    } else if (calculated !== currentVal) {
                        setValue('amount', calculated);
                    }
                    setShowKeypad(false);
                }}
            />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  backBtn: { padding: 8, borderRadius: 20, marginRight: 15 },
  deleteBtn: { padding: 8, marginLeft: 'auto' }, // E shtyn djathtas
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  
  switchContainer: { flexDirection: 'row', borderRadius: 12, padding: 4, marginBottom: 24 },
  switchBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  switchText: { fontWeight: '600' },

  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputLarge: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, paddingVertical: 10, borderBottomWidth: 2 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 24 },
  
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginBottom: 8 },
  chipText: { fontWeight: '500' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, shadowColor: '#2563EB', shadowOpacity: 0.3, elevation: 4 }
});