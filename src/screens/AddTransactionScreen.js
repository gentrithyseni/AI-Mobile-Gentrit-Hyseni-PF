import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createTransaction, deleteTransaction, updateTransaction } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function AddTransactionScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  
  // Marrim transaksionin nëse po vijmë për editim
  const transactionToEdit = route.params?.transaction;
  const isEditing = !!transactionToEdit;

  const { control, handleSubmit, setValue } = useForm({ 
    defaultValues: { 
      amount: '', 
      category: 'Ushqim', 
      notes: '' 
    } 
  });
  
  const [type, setType] = useState('expense');

  // Mbushim formën nëse jemi duke edituar
  useEffect(() => {
    if (isEditing) {
      setValue('amount', String(transactionToEdit.amount));
      setValue('category', transactionToEdit.category);
      setValue('notes', transactionToEdit.description || '');
      // Përcaktojmë tipin bazuar në kategori ose fushën type
      if (['Paga', 'Te Ardhura', 'Income', 'Dhurata'].includes(transactionToEdit.category) || transactionToEdit.type === 'income') {
        setType('income');
      } else {
        setType('expense');
      }
    }
  }, [transactionToEdit]);

  const EXPENSE_CATS = ['Ushqim', 'Transport', 'Qira', 'Argëtim', 'Tjetër'];
  const INCOME_CATS = ['Paga', 'Te Ardhura', 'Dhurata', 'Tjetër'];
  const activeCats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;

  const onSubmit = async (values) => {
    try {
      const txData = {
        user_id: user?.id,
        amount: parseFloat(values.amount),
        type: type,
        category: type === 'income' ? (values.category === 'Ushqim' ? 'Income' : values.category) : values.category,
        description: values.notes || 'Pa përshkrim',
        date: isEditing ? transactionToEdit.date : new Date().toISOString(),
      };

      if (isEditing) {
        await updateTransaction(transactionToEdit.id, txData);
      } else {
        await createTransaction(txData);
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
            } catch (e) {
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
                <TextInput 
                    keyboardType="numeric" 
                    style={[styles.inputLarge, { color: colors.text, borderColor: colors.border }]} 
                    placeholder="0.00" 
                    placeholderTextColor={colors.textSecondary}
                    value={value} 
                    onChangeText={onChange} 
                />
                )}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Kategoria</Text>
            <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                <View style={{flexDirection:'row', flexWrap:'wrap', gap: 10, marginBottom: 20}}>
                    {activeCats.map(cat => (
                        <TouchableOpacity 
                            key={cat} 
                            onPress={() => onChange(cat)}
                            style={[styles.chip, { backgroundColor: colors.card }, value === cat && { backgroundColor: colors.primary }]}>
                            <Text style={[styles.chipText, { color: colors.text }, value === cat && { color: 'white' }]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                )}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Përshkrimi / Shënime</Text>
            <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                  placeholder="p.sh. Kafe me shoqërinë" 
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

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, shadowColor: '#2563EB', shadowOpacity: 0.3, elevation: 4 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});