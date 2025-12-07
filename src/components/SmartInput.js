import { useState } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

export const SmartInput = ({ 
  value, 
  onChangeText, 
  onSelectionChange, 
  selection: propSelection,
  onFocus, 
  placeholder, 
  style, 
  isActive 
}) => {
  const { colors } = useTheme();
  const [internalSelection, setInternalSelection] = useState({ start: 0, end: 0 });

  const selection = propSelection || internalSelection;

  const handleSelectionChange = (event) => {
    const sel = event.nativeEvent.selection;
    setInternalSelection(sel);
    if (onSelectionChange) onSelectionChange(sel);
  };

  const displayValue = () => {
    if (!isActive || Platform.OS === 'web') return value;
    const val = value || '';
    const start = selection.start || 0;
    
    if (!val && placeholder) {
        return (
            <>
             <Text style={{ fontWeight: '100', opacity: 0.5 }}>|</Text>
             <Text style={{ color: colors.textSecondary }}>{placeholder}</Text>
            </>
        );
    }

    return (
      <>
        {val.slice(0, start)}
        <Text style={{ fontWeight: '100', opacity: 0.5 }}>|</Text>
        {val.slice(start)}
      </>
    );
  };

  const flatStyle = StyleSheet.flatten(style) || {};
  
  // Extract text-related styles for the overlay
  const textStyle = {
    fontSize: flatStyle.fontSize,
    fontWeight: flatStyle.fontWeight,
    textAlign: flatStyle.textAlign,
    padding: flatStyle.padding,
    paddingTop: flatStyle.paddingTop,
    paddingBottom: flatStyle.paddingBottom,
    paddingVertical: flatStyle.paddingVertical,
    paddingHorizontal: flatStyle.paddingHorizontal,
    color: colors.text, // Ensure this uses the theme color
    // Ensure alignment matches
    lineHeight: flatStyle.lineHeight,
  };

  return (
    <View style={{ position: 'relative' }}>
      {/* Fake Text with Cursor (Mobile Only) */}
      {Platform.OS !== 'web' && (
        <View pointerEvents="none" style={[style, { position: 'absolute', width: '100%', height: '100%', borderColor: 'transparent', backgroundColor: 'transparent', zIndex: 0 }]}>
             {(!value && !isActive) ? (
                 <Text style={[textStyle, { color: colors.textSecondary }]}>{placeholder}</Text>
             ) : (
                 <Text style={textStyle}>{displayValue()}</Text>
             )}
        </View>
      )}

      {/* Real Input */}
      <TextInput
        value={value}
        onChangeText={(text) => {
            // Validation for non-numeric characters (Web mainly, but good for all)
            // Allow numbers, operators (+-*/), dot (.), and empty string
            if (/^[0-9+\-*/.]*$/.test(text)) {
                onChangeText(text);
            } else {
                // If on Web, we can show an alert. On mobile, the keypad restricts it anyway, 
                // but if a physical keyboard is used on mobile, this helps too.
                if (Platform.OS === 'web') {
                    alert('Ju lutem shkruani vetëm numra dhe operatorë.');
                }
            }
        }}
        onSelectionChange={handleSelectionChange}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary} // Use passed color or default
        showSoftInputOnFocus={Platform.OS === 'web'}
        style={[
          style, 
          Platform.OS !== 'web' && { opacity: 0, zIndex: 1 } // Fully transparent on mobile
        ]}
        caretHidden={Platform.OS !== 'web'}
      />
    </View>
  );
};
