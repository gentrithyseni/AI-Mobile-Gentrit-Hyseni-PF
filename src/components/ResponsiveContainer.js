import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const ResponsiveContainer = ({ children, style }) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.outer, { backgroundColor: colors.background }]}>
      <View style={[styles.inner, style, { backgroundColor: colors.background }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
  },
  inner: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%', // Limit width on desktop/web
    alignSelf: 'center',
  }
});
