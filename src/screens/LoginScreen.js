import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';

const FOREST_GREEN = '#2d5016';

export default function LoginScreen({ navigation }) {
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const { control, handleSubmit, watch, reset } = useForm({
    defaultValues: { email: '', password: '', passwordConfirm: '', username: '' },
  });
  const password = watch('password');

  const onSignInSubmit = async (values) => {
    try {
      const res = await signIn({ email: values.email, password: values.password });
      if (res.error) {
        Alert.alert('Sign In Failed', res.error.message || 'Login failed');
      } else {
        // Successfully signed in; app will auto-redirect to home via AuthGate
        Alert.alert('Success', 'Signed in successfully!');
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const onSignUpSubmit = async (values) => {
    if (values.password !== values.passwordConfirm) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    try {
      const res = await signUp({ email: values.email, password: values.password, username: values.username });
      if (res.error) {
        Alert.alert('Sign Up Failed', res.error.message || 'Registration failed');
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
    } catch (e) {
      Alert.alert('Error', e.message);
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
          style={styles.button}
          onPress={handleSubmit(isSignUp ? onSignUpSubmit : onSignInSubmit)}
        >
          <Text style={styles.buttonText}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
        </TouchableOpacity>

        {/* Toggle Button */}
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => {
            reset();
            setIsSignUp(!isSignUp);
          }}
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
