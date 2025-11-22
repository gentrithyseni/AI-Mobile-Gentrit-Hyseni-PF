import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createTransaction, deleteTransaction, updateTransaction } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';

export default function AddTransactionScreen({ navigation, route }) {
  const { user } = useAuth();
  
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
      <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <ArrowLeft size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{isEditing ? 'Ndrysho Transaksion' : 'Shto Transaksion'}</Text>
            
            {/* Butoni Fshij shfaqet vetëm kur jemi duke edituar */}
            {isEditing && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Trash2 size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
        </View>

        <ScrollView contentContainerStyle={{padding: 20}}>
            <View style={styles.switchContainer}>
                <TouchableOpacity onPress={() => setType('expense')} style={[styles.switchBtn, type === 'expense' && styles.activeExpense]}>
                    <Text style={[styles.switchText, type === 'expense' && styles.activeText]}>Shpenzim</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setType('income')} style={[styles.switchBtn, type === 'income' && styles.activeIncome]}>
                    <Text style={[styles.switchText, type === 'income' && styles.activeText]}>Të Ardhura</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.label}>Shuma (€)</Text>
            <Controller
                control={control}
                name="amount"
                render={({ field: { onChange, value } }) => (
                <TextInput 
                    keyboardType="numeric" 
                    style={styles.inputLarge} 
                    placeholder="0.00" 
                    value={value} 
                    onChangeText={onChange} 
                />
                )}
            />

            <Text style={styles.label}>Kategoria</Text>
            <Controller
                control={control}
                name="category"
                render={({ field: { onChange, value } }) => (
                <View style={{flexDirection:'row', flexWrap:'wrap', gap: 10, marginBottom: 20}}>
                    {activeCats.map(cat => (
                        <TouchableOpacity 
                            key={cat} 
                            onPress={() => onChange(cat)}
                            style={[styles.chip, value === cat && styles.activeChip]}
                        >
                            <Text style={[styles.chipText, value === cat && styles.activeChipText]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                )}
            />

            <Text style={styles.label}>Përshkrimi / Shënime</Text>
            <Controller
                control={control}
                name="notes"
                render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} placeholder="p.sh. Kafe me shoqërinë" value={value} onChangeText={onChange} />
                )}
            />

            <TouchableOpacity onPress={handleSubmit(onSubmit)} style={styles.saveBtn}>
                <Save size={20} color="white" style={{marginRight:8}} />
                <Text style={styles.saveBtnText}>{isEditing ? 'Përditëso' : 'Ruaj Transaksionin'}</Text>
            </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10, backgroundColor: 'white' },
  backBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20, marginRight: 15 },
  deleteBtn: { padding: 8, marginLeft: 'auto' }, // E shtyn djathtas
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  
  switchContainer: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 12, padding: 4, marginBottom: 24 },
  switchBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  activeExpense: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  activeIncome: { backgroundColor: 'white', shadowColor: '#000', shadowOpacity: 0.1, elevation: 2 },
  switchText: { fontWeight: '600', color: '#6B7280' },
  activeText: { color: '#1F2937' },

  label: { fontSize: 14, fontWeight: '600', color: '#4B5563', marginBottom: 8 },
  inputLarge: { fontSize: 32, fontWeight: 'bold', color: '#1F2937', marginBottom: 24, paddingVertical: 10, borderBottomWidth: 2, borderColor: '#E5E7EB' },
  input: { backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 24 },
  
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#E5E7EB', marginBottom: 8 },
  activeChip: { backgroundColor: '#2563EB' },
  chipText: { color: '#4B5563', fontWeight: '500' },
  activeChipText: { color: 'white' },

  saveBtn: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, shadowColor: '#2563EB', shadowOpacity: 0.3, elevation: 4 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});