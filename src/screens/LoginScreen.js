import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const FOREST_GREEN = '#2d5016';

// Helper function to show alerts that work on both web and mobile
const showAlert = (title, message) => {
  if (Platform.OS === 'web') {
    // On web, use window.alert which actually shows a dialog
    if (typeof window !== 'undefined' && window.alert) {
      window.alert(`${title}\n\n${message}`);
    } else {
      console.error(`[Alert] ${title}: ${message}`);
    }
  } else {
    // On mobile, use React Native Alert
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
    // Validation
    if (!values.email.trim()) {
      showAlert('Error', 'Email is required');
      return;
    }
    if (!values.password.trim()) {
      showAlert('Error', 'Password is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      showAlert('Error', 'Please enter a valid email');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[login] Signing in with:', values.email);
      const res = await signIn({ email: values.email, password: values.password });
      console.log('[login] signIn response:', res);
      
      if (res.error) {
        console.error('[login] Error:', res.error);
        const errorMessage = res.error.message || 'Login failed. Check your email and password.';
        showAlert('Sign In Failed', errorMessage);
      } else {
        console.log('[login] Successfully signed in');
        showAlert('Success', 'Signed in successfully!');
      }
    } catch (e) {
      console.error('[login] Exception:', e);
      const errorMessage = e instanceof Error ? e.message : 'An error occurred during sign in';
      showAlert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const onSignUpSubmit = async (values) => {
    // Validation
    if (!values.email.trim()) {
      showAlert('Error', 'Email is required');
      return;
    }
    if (!values.username.trim()) {
      showAlert('Error', 'Username is required');
      return;
    }
    if (!values.password.trim()) {
      showAlert('Error', 'Password is required');
      return;
    }
    if (values.password.length < 6) {
      showAlert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
      showAlert('Error', 'Please enter a valid email');
      return;
    }
    if (values.password !== values.passwordConfirm) {
      showAlert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[login] Signing up with:', values.email);
      const res = await signUp({ email: values.email, password: values.password, username: values.username });
      console.log('[login] signUp response:', res);
      
      if (res.error) {
        console.error('[login] Error:', res.error);
        const errorMessage = res.error.message || 'Registration failed. Try another email.';
        showAlert('Sign Up Failed', errorMessage);
      } else {
        console.log('[login] Successfully signed up');
        if (Platform.OS === 'web') {
          window.alert('Success\n\nAccount created! Please sign in now.');
          reset();
          setIsSignUp(false);
        } else {
          Alert.alert('Success', 'Account created! Please sign in now.', [
            {
              text: 'OK',
              onPress: () => {
                reset();
                setIsSignUp(false);
              },
            },
          ]);
        }
      }
    } catch (e) {
      console.error('[login] Exception:', e);
      const errorMessage = e instanceof Error ? e.message : 'An error occurred during sign up';
      showAlert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.innerContainer}>
        <Text style={styles.title}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>

        {/* Email Input */}
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          )}
        />

        {/* Username Input (Sign Up Only) */}
        {isSignUp && (
          <Controller
            control={control}
            name="username"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Username"
                placeholderTextColor="#999"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
              />
            )}
          />
        )}

        {/* Password Input */}
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              secureTextEntry
              value={value}
              onChangeText={onChange}
            />
          )}
        />

        {/* Password Confirmation (Sign Up Only) */}
        {isSignUp && (
          <Controller
            control={control}
            name="passwordConfirm"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={value}
                onChangeText={onChange}
              />
            )}
          />
        )}

        {/* Primary Button */}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit(isSignUp ? onSignUpSubmit : onSignInSubmit)}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </Text>
        </TouchableOpacity>

        {/* Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            if (!isLoading) {
              reset();
              setIsSignUp(!isSignUp);
            }
          }}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={styles.toggleButtonText}>
            {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    padding: 16,
  },
  innerContainer: {
    width: '100%',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: FOREST_GREEN,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: FOREST_GREEN,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: '#a0a0a0',
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  toggleButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: FOREST_GREEN,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});
