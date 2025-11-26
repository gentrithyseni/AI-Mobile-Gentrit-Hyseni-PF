import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const lightTheme = {
  dark: false,
  colors: {
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#1F2937',
    textSecondary: '#6B7280',
    primary: '#2563EB',
    border: '#E5E7EB',
    inputBackground: '#FFFFFF',
    success: '#10B981',
    danger: '#EF4444',
    iconBg: '#F3F4F6',
    headerText: '#1F2937',
  }
};

export const darkTheme = {
  dark: true,
  colors: {
    background: '#111827', // Very dark gray
    card: '#1F2937',       // Dark gray
    text: '#F9FAFB',       // Almost white
    textSecondary: '#9CA3AF', // Light gray
    primary: '#64748B',    // Slate Grey (Blue-ish Grey) for Dark Mode
    border: '#374151',     // Darker border
    inputBackground: '#374151',
    success: '#34D399',
    danger: '#F87171',
    iconBg: '#374151',
    headerText: '#FFFFFF',
  }
};

export const ThemeProvider = ({ children }) => {
  const systemScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currency, setCurrency] = useState('€'); // Default currency symbol
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const storedTheme = await AsyncStorage.getItem('theme');
      if (storedTheme) {
        setIsDarkMode(storedTheme === 'dark');
      } else {
        setIsDarkMode(systemScheme === 'dark');
      }
      
      const storedCurrency = await AsyncStorage.getItem('currency');
      if (storedCurrency) setCurrency(storedCurrency);
      
    } catch (e) {
      console.error('Failed to load theme', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem('theme', newMode ? 'dark' : 'light');
    } catch (e) {
      console.error('Failed to save theme', e);
    }
  };

  const setAppCurrency = async (newCurrency) => {
      setCurrency(newCurrency);
      try {
          await AsyncStorage.setItem('currency', newCurrency);
      } catch (e) {
          console.error(e);
      }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ ...theme, isDarkMode, toggleTheme, currency, setAppCurrency }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
