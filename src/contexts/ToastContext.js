import { AlertCircle, CheckCircle, Info } from 'lucide-react-native';
import { createContext, useCallback, useContext, useState } from 'react';
import { Animated, Platform, StyleSheet, Text } from 'react-native';

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' });
  const [fadeAnim] = useState(new Animated.Value(0));

  const showToast = useCallback((message, type = 'info') => {
    setToast({ visible: true, message, type });
    
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3000),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
        if (fadeAnim._value === 0) {
            setToast(prev => ({ ...prev, visible: false }));
        }
    });
  }, [fadeAnim]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success': return <CheckCircle color="white" size={24} />;
      case 'error': return <AlertCircle color="white" size={24} />;
      default: return <Info color="white" size={24} />;
    }
  };

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success': return '#10B981'; // Green
      case 'error': return '#EF4444';   // Red
      default: return '#3B82F6';        // Blue
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <Animated.View 
            style={[
                styles.toastContainer, 
                { opacity: fadeAnim, backgroundColor: getBackgroundColor() }
            ]}
        >
          {getIcon()}
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 15,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 9999,
    maxWidth: 800,
    alignSelf: 'center',
    width: Platform.OS === 'web' ? 'auto' : undefined,
    minWidth: Platform.OS === 'web' ? 300 : undefined,
  },
  toastText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  }
});
