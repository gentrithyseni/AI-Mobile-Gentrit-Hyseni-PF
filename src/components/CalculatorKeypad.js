import { Delete } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export default function CalculatorKeypad({ onKeyPress, onDelete, onSubmit }) {
  const { colors } = useTheme();

  const rows = [
    ['1', '2', '3', '+'],
    ['4', '5', '6', '-'],
    ['7', '8', '9', '*'],
    ['.', '0', 'DEL', '/'],
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((key) => {
            const isOperator = ['+', '-', '*', '/'].includes(key);
            const isDelete = key === 'DEL';
            
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.key,
                  isOperator && { backgroundColor: colors.background }, // Different bg for operators
                ]}
                onPress={() => {
                  if (isDelete) {
                    onDelete();
                  } else {
                    onKeyPress(key);
                  }
                }}
              >
                {isDelete ? (
                  <Delete size={24} color={colors.text} />
                ) : (
                  <Text style={[
                    styles.keyText, 
                    { color: colors.text },
                    isOperator && { color: colors.primary, fontWeight: 'bold' }
                  ]}>
                    {key}
                  </Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      ))}
      
      <TouchableOpacity 
        style={[styles.doneBtn, { backgroundColor: colors.primary }]} 
        onPress={onSubmit}
      >
        <Text style={styles.doneBtnText}>Përfundo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 30,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  key: {
    width: '22%',
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '500',
  },
  doneBtn: {
    marginHorizontal: 10,
    marginTop: 5,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
