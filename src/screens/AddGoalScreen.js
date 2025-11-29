import { ArrowLeft, Save, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createGoal, deleteGoal, updateGoal } from '../api/goals';
import CalculatorKeypad from '../components/CalculatorKeypad';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { evaluateExpression } from '../utils/financeCalculations';

export default function AddGoalScreen({ navigation, route }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [activeField, setActiveField] = useState(null); // 'target' or 'current' or null
  
  const goalToEdit = route.params?.goal;
  const isEditing = !!goalToEdit;

  const { control, handleSubmit, setValue } = useForm({ 
    defaultValues: { 
      title: '', 
      target_amount: '', 
      current_amount: '0',
      icon: '🎯'
    } 
  });

  const ICONS = ['🎯', '💻', '🏖️', '🚗', '🏠', '💍', '🎓', '🏥', '💰', '📱'];
  const [selectedIcon, setSelectedIcon] = useState('🎯');

  useEffect(() => {
    if (isEditing) {
      setValue('title', goalToEdit.title);
      setValue('target_amount', String(goalToEdit.target_amount));
      setValue('current_amount', String(goalToEdit.current_amount));
      setSelectedIcon(goalToEdit.icon || '🎯');
    }
  }, [goalToEdit, isEditing, setValue]);

  const onSubmit = async (values) => {
    try {
      const targetAmount = parseFloat(evaluateExpression(values.target_amount));
      const currentAmount = parseFloat(evaluateExpression(values.current_amount || '0'));

      if (isNaN(targetAmount) || targetAmount < 0) {
        alert('Shuma e synuar nuk është valide!');
        return;
      }

      const goalData = {
        user_id: user?.id,
        title: values.title,
        target_amount: targetAmount,
        current_amount: currentAmount,
        icon: selectedIcon,
        color: '#3B82F6' // Default color for now
      };

      if (isEditing) {
        await updateGoal(goalToEdit.id, goalData);
      } else {
        await createGoal(goalData);
      }
      
      navigation.goBack();
    } catch (e) {
      console.error("Gabim:", e);
      alert('Gabim: ' + (e.message || e.toString()));
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Fshij Synimin",
      "A jeni i sigurt?",
      [
        { text: "Jo", style: "cancel" },
        { 
          text: "Po, Fshije", 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteGoal(goalToEdit.id);
              navigation.goBack();
            } catch (_e) {
              alert("Gabim gjatë fshirjes");
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? colors.background : '#F3F4F6' }]}>
                <ArrowLeft size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>{isEditing ? 'Ndrysho Synimin' : 'Shto Synim'}</Text>
            
            {isEditing && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Trash2 size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
        </View>

        <ScrollView contentContainerStyle={{padding: 20}}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Titulli i Synimit</Text>
            <Controller
                control={control}
                name="title"
                render={({ field: { onChange, value } }) => (
                <TextInput 
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                    placeholder="p.sh. Laptop i ri" 
                    placeholderTextColor={colors.textSecondary}
                    value={value} 
                    onChangeText={onChange} 
                />
                )}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Shuma e Synuar (€)</Text>
            <Controller
                control={control}
                name="target_amount"
                render={({ field: { onChange, value } }) => (
                <View>
                  <TextInput 
                      showSoftInputOnFocus={false}
                      onFocus={() => {
                          Keyboard.dismiss();
                          setActiveField('target');
                      }}
                      style={[styles.inputLarge, { color: colors.text, borderColor: colors.border }]} 
                      placeholder="0.00" 
                      placeholderTextColor={colors.textSecondary}
                      value={value} 
                      editable={true}
                  />
                  <Text style={{color: colors.textSecondary, fontSize: 12, marginTop: -5, marginBottom: 15}}>
                    Mund të shkruani llogaritje (psh. 1000+500)
                  </Text>
                </View>
                )}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Shuma Aktuale (€)</Text>
            <Controller
                control={control}
                name="current_amount"
                render={({ field: { onChange, value } }) => (
                <View>
                <TextInput 
                    showSoftInputOnFocus={false}
                    onFocus={() => {
                        Keyboard.dismiss();
                        setActiveField('current');
                    }}
                    style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }]} 
                    placeholder="0.00" 
                    placeholderTextColor={colors.textSecondary}
                    value={value} 
                    editable={true}
                />
                </View>
                )}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>Ikona</Text>
            <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24}}>
                {ICONS.map(icon => (
                    <TouchableOpacity 
                        key={icon} 
                        onPress={() => setSelectedIcon(icon)}
                        style={[
                            styles.iconBtn, 
                            { backgroundColor: colors.card, borderColor: colors.border },
                            selectedIcon === icon && { backgroundColor: colors.primary, borderColor: colors.primary }
                        ]}
                    >
                        <Text style={{fontSize: 24}}>{icon}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity onPress={handleSubmit(onSubmit)} style={[styles.saveBtn, { backgroundColor: colors.primary }]}>
                <Save size={20} color="white" style={{marginRight:8}} />
                <Text style={styles.saveBtnText}>{isEditing ? 'Përditëso' : 'Ruaj Synimin'}</Text>
            </TouchableOpacity>
        </ScrollView>

        {/* Custom Calculator Keypad */}
        {activeField && (
            <CalculatorKeypad 
                onKeyPress={(key) => {
                    const fieldName = activeField === 'target' ? 'target_amount' : 'current_amount';
                    const currentVal = control._formValues[fieldName] || '';
                    setValue(fieldName, currentVal + key);
                }}
                onDelete={() => {
                    const fieldName = activeField === 'target' ? 'target_amount' : 'current_amount';
                    const currentVal = control._formValues[fieldName] || '';
                    setValue(fieldName, currentVal.slice(0, -1));
                }}
                onSubmit={() => {
                    // Calculate on Done
                    const fieldName = activeField === 'target' ? 'target_amount' : 'current_amount';
                    const currentVal = control._formValues[fieldName] || '';
                    const calculated = evaluateExpression(currentVal);
                    
                    if (parseFloat(calculated) < 0) {
                        Alert.alert("Gabim", "Shuma nuk mund të jetë negative");
                        setValue(fieldName, "");
                    } else if (calculated !== currentVal) {
                        setValue(fieldName, calculated);
                    }
                    setActiveField(null);
                }}
            />
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 10 },
  backBtn: { padding: 8, borderRadius: 20, marginRight: 15 },
  deleteBtn: { padding: 8, marginLeft: 'auto' },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputLarge: { fontSize: 32, fontWeight: 'bold', marginBottom: 24, paddingVertical: 10, borderBottomWidth: 2 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 24 },
  
  iconBtn: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 14, shadowColor: '#2563EB', shadowOpacity: 0.3, elevation: 4 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});
