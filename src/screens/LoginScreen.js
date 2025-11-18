import React from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const { control, handleSubmit } = useForm({ defaultValues: { email: '', password: '' } });

  const onSubmit = async (values) => {
    try {
      const res = await signIn(values);
      if (res.error) {
        alert(res.error.message || 'Login failed');
      }
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Email" value={value} onChangeText={onChange} />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, value } }) => (
          <TextInput style={styles.input} placeholder="Password" secureTextEntry value={value} onChangeText={onChange} />
        )}
      />
      <Button title="Sign In" onPress={handleSubmit(onSubmit)} />
      <Button title="Register" onPress={() => navigation.navigate('Register')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, marginBottom: 12, borderRadius: 6 },
  title: { fontSize: 24, marginBottom: 16, textAlign: 'center' },
});
