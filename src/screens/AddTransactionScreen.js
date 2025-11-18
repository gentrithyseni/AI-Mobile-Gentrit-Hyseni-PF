import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { createTransaction } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';

export default function AddTransactionScreen({ navigation }) {
  const { user } = useAuth();
  const { control, handleSubmit } = useForm({ defaultValues: { amount: '', category: '', notes: '' } });

  const onSubmit = async (values) => {
    try {
      const tx = {
        user_id: user?.id,
        amount: parseFloat(values.amount),
        category: values.category || 'Other',
        notes: values.notes || null,
        date: new Date().toISOString(),
      };
      await createTransaction(tx);
      navigation.goBack();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Transaction</Text>
      <Controller
        control={control}
        name="amount"
        render={({ field: { onChange, value } }) => (
          <TextInput keyboardType="numeric" style={styles.input} placeholder="Amount" value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="category"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Category" value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="notes"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Notes" value={value} onChangeText={onChange} />
        )}
      />
      <Button title="Save" onPress={handleSubmit(onSubmit)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12, borderRadius: 6 },
  title: { fontSize: 20, marginBottom: 12 },
});
