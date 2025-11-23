import { Wallet } from 'lucide-react-native'; // Sigurohu qe ke instaluar lucide-react-native
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Ngjyra e re "Blue Theme"
const PRIMARY_BLUE = '#2563EB';
const BG_COLOR = '#F3F4F6';

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function LoginScreen({ navigation }) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { email: '', password: '', passwordConfirm: '', username: '' },
  });

  const onSignInSubmit = async (values) => {
    setIsLoading(true);
    try {
      const res = await signIn({ email: values.email, password: values.password });
      if (res.error) showAlert('Gabim', res.error.message);
    } catch (e) {
      showAlert('Gabim', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpSubmit = async (values) => {
    if (values.password !== values.passwordConfirm) {
      showAlert('Gabim', 'Fjalëkalimet nuk përputhen');
      return;
    }
    setIsLoading(true);
    try {
      const res = await signUp({ email: values.email, password: values.password, username: values.username });
      if (res.error) {
        showAlert('Gabim', res.error.message);
      } else {
        showAlert('Sukses', 'Llogaria u krijua! Tani mund të hyni.');
        reset();
        setIsSignUp(false);
      }
    } catch (e) {
      showAlert('Gabim', e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBackground}>
        <View style={styles.iconContainer}>
            <Wallet size={40} color="white" />
        </View>
      </View>
      
      <View style={styles.cardContainer}>
        <Text style={styles.title}>{isSignUp ? 'Krijo Llogari' : 'Mirë se vini'}</Text>
        <Text style={styles.subtitle}>Menaxho financat tuaja me inteligjencë.</Text>

        {/* Form Inputs */}
        <View style={styles.form}>
           {isSignUp && (
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} placeholder="Emri i përdoruesit" value={value} onChangeText={onChange} placeholderTextColor="#9CA3AF" />
              )}
            />
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} placeholder="Email" value={value} onChangeText={onChange} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#9CA3AF" />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} placeholder="Fjalëkalimi" value={value} onChangeText={onChange} secureTextEntry placeholderTextColor="#9CA3AF" />
            )}
          />

          {isSignUp && (
            <Controller
              control={control}
              name="passwordConfirm"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} placeholder="Konfirmo Fjalëkalimin" value={value} onChangeText={onChange} secureTextEntry placeholderTextColor="#9CA3AF" />
              )}
            />
          )}

          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmit(isSignUp ? onSignUpSubmit : onSignInSubmit)}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{isSignUp ? 'Regjistrohuni' : 'Hyni'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { reset(); setIsSignUp(!isSignUp); }} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>
              {isSignUp ? 'Keni llogari? Hyni këtu' : 'Nuk keni llogari? Regjistrohuni'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EFF6FF' },
  headerBackground: {
    height: '35%',
    backgroundColor: PRIMARY_BLUE,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 20,
    borderRadius: 25,
    marginBottom: 20,
  },
  cardContainer: {
    flex: 1,
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginTop: -50,
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
  },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', color: '#1F2937', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#6B7280', marginBottom: 32 },
  form: { width: '100%' },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 15,
    color: '#374151'
  },
  button: {
    backgroundColor: PRIMARY_BLUE,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: PRIMARY_BLUE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  toggleButton: { marginTop: 20, alignItems: 'center' },
  toggleButtonText: { color: PRIMARY_BLUE, fontWeight: '500' },
});