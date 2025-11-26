import { Eye, EyeOff, Moon, Sun, Wallet } from 'lucide-react-native'; // Sigurohu qe ke instaluar lucide-react-native
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { ActivityIndicator, Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.alert) window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
};

export default function LoginScreen({ navigation }) {
  const { signIn, signUp } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { control, handleSubmit, reset } = useForm({
    defaultValues: { email: '', password: '', passwordConfirm: '', username: '' },
  });

  const onSignInSubmit = async (values) => {
    setIsLoading(true);
    try {
      const res = await signIn({ email: values.email, password: values.password });
      if (res.error) {
        // Përkthejmë mesazhin e gabimit nëse është "Invalid login credentials"
        const msg = res.error.message.includes('Invalid login credentials') 
          ? 'Të dhënat janë të gabuara. Ju lutem provoni përsëri.' 
          : res.error.message;
        showAlert('Gabim', msg);
      }
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerBackground, { backgroundColor: colors.primary }]}>
        <TouchableOpacity 
            onPress={toggleTheme} 
            style={{ 
                position: 'absolute', 
                top: 50, 
                left: 20, 
                padding: 8, 
                backgroundColor: 'rgba(255,255,255,0.2)', 
                borderRadius: 20,
                zIndex: 10
            }}
        >
            {isDarkMode ? <Sun size={24} color="white" /> : <Moon size={24} color="white" />}
        </TouchableOpacity>

        <View style={styles.iconContainer}>
            <Wallet size={40} color="white" />
        </View>
      </View>
      
      <View style={[styles.cardContainer, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>{isSignUp ? 'Krijo Llogari' : 'Mirë se vini'}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Menaxho financat tuaja me inteligjencë.</Text>

        {/* Form Inputs */}
        <View style={styles.form}>
           {isSignUp && (
            <Controller
              control={control}
              name="username"
              render={({ field: { onChange, value } }) => (
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} 
                  placeholder="Emri i përdoruesit" 
                  value={value} 
                  onChangeText={onChange} 
                  placeholderTextColor={colors.textSecondary} 
                />
              )}
            />
          )}

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <TextInput 
                style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text }]} 
                placeholder="Email" 
                value={value} 
                onChangeText={onChange} 
                keyboardType="email-address" 
                autoCapitalize="none" 
                placeholderTextColor={colors.textSecondary} 
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View style={{position: 'relative', justifyContent: 'center'}}>
                <TextInput 
                  style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text, paddingRight: 50 }]} 
                  placeholder="Fjalëkalimi" 
                  value={value} 
                  onChangeText={onChange} 
                  secureTextEntry={!showPassword} 
                  placeholderTextColor={colors.textSecondary} 
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={{position: 'absolute', right: 15, top: 15}}
                >
                  {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
                </TouchableOpacity>
              </View>
            )}
          />

          {isSignUp && (
            <Controller
              control={control}
              name="passwordConfirm"
              render={({ field: { onChange, value } }) => (
                <View style={{position: 'relative', justifyContent: 'center'}}>
                  <TextInput 
                    style={[styles.input, { backgroundColor: colors.inputBackground, borderColor: colors.border, color: colors.text, paddingRight: 50 }]} 
                    placeholder="Konfirmo Fjalëkalimin" 
                    value={value} 
                    onChangeText={onChange} 
                    secureTextEntry={!showPassword} 
                    placeholderTextColor={colors.textSecondary} 
                  />
                </View>
              )}
            />
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary, shadowColor: colors.primary }]}
            onPress={handleSubmit(isSignUp ? onSignUpSubmit : onSignInSubmit)}
            disabled={isLoading}
          >
            {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>{isSignUp ? 'Regjistrohuni' : 'Hyni'}</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { reset(); setIsSignUp(!isSignUp); }} style={styles.toggleButton}>
            <Text style={[styles.toggleButtonText, { color: colors.primary }]}>
              {isSignUp ? 'Keni llogari? Hyni këtu' : 'Nuk keni llogari? Regjistrohuni'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBackground: {
    height: '35%',
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
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, textAlign: 'center', marginBottom: 32 },
  form: { width: '100%' },
  input: {
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 15,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '600' },
  toggleButton: { marginTop: 20, alignItems: 'center' },
  toggleButtonText: { fontWeight: '500' },
});