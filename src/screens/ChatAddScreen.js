import { ArrowLeft, CheckCircle, Send, Sparkles, XCircle } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { parseTransactionWithAI } from '../api/gemini';
import { createTransaction } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ChatAddScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme(); // Përdorim temën tënde
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Përshëndetje! 👋 Unë jam asistenti yt financiar.\nMë trego çfarë shpenzove ose fitove sot.\n\nShembull: 'Pagova 25 euro për rrymë'", sender: 'ai' }
  ]);
  const [loading, setLoading] = useState(false);
  const [pendingTx, setPendingTx] = useState(null);
  const scrollViewRef = useRef();

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    // 1. Shfaq mesazhin e userit
    const userMsg = { id: Date.now(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setPendingTx(null);

    try {
      // 2. Pyet AI
      const result = await parseTransactionWithAI(userText);
      
      if (result) {
        setPendingTx(result);
        const aiMsg = { 
          id: Date.now() + 1, 
          text: `E kuptova! 👇\n\nShuma: €${result.amount}\nKategoria: ${result.category}\nPërshkrimi: ${result.notes}`, 
          sender: 'ai' 
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        setMessages(prev => [...prev, { id: Date.now()+1, text: "Më fal, nuk e kuptova mirë. Provo të shkruash shumën dhe kategorinë më qartë.", sender: 'ai' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now()+1, text: "Pata një problem me lidhjen. Provo përsëri.", sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingTx || !user) return;
    try {
      const tx = {
        user_id: user.id,
        amount: pendingTx.amount,
        category: pendingTx.category,
        type: pendingTx.type,
        description: pendingTx.notes,
        date: new Date().toISOString(),
      };
      await createTransaction(tx);
      setMessages(prev => [...prev, { id: Date.now(), text: "✅ U ruajt me sukses! Mund të vazhdosh me tjetrën.", sender: 'ai' }]);
      setPendingTx(null);
    } catch (e) {
      alert("Gabim gjatë ruajtjes: " + e.message);
    }
  };

  const handleCancel = () => {
    setPendingTx(null);
    setMessages(prev => [...prev, { id: Date.now(), text: "Në rregull, e anulova. Më thuaj tjetrën.", sender: 'ai' }]);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.container, { backgroundColor: colors.background }]}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
           <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <Sparkles size={18} color="#7C3AED" style={{marginRight: 8}} />
            <Text style={[styles.headerTitle, { color: colors.text }]}>AI Assistant</Text>
        </View>
      </View>

      {/* Chat Area */}
      <ScrollView 
        style={styles.chatArea} 
        contentContainerStyle={{paddingBottom: 20}}
        ref={scrollViewRef}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map(msg => (
          <View key={msg.id} style={[
            styles.msgBubble, 
            msg.sender === 'user' 
              ? { backgroundColor: colors.primary, borderBottomRightRadius: 4, alignSelf: 'flex-end' } 
              : { backgroundColor: colors.card, borderBottomLeftRadius: 4, alignSelf: 'flex-start', borderWidth: 1, borderColor: colors.border }
          ]}>
            <Text style={[styles.msgText, { color: msg.sender === 'user' ? 'white' : colors.text }]}>{msg.text}</Text>
          </View>
        ))}
        
        {loading && <ActivityIndicator style={{marginTop:10}} color={colors.primary} />}
        
        {/* Preview & Confirm Card */}
        {pendingTx && (
          <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <Text style={[styles.previewTitle, { color: colors.text }]}>Konfirmo Transaksionin</Text>
             <View style={styles.previewRow}>
                <Text style={{ color: colors.textSecondary }}>Shuma:</Text>
                <Text style={{ fontWeight: 'bold', color: colors.text }}>€{pendingTx.amount}</Text>
             </View>
             <View style={styles.previewRow}>
                <Text style={{ color: colors.textSecondary }}>Kategoria:</Text>
                <Text style={{ fontWeight: 'bold', color: colors.text }}>{pendingTx.category}</Text>
             </View>
             <View style={styles.previewRow}>
                <Text style={{ color: colors.textSecondary }}>Lloji:</Text>
                <Text style={{ fontWeight: 'bold', color: pendingTx.type === 'income' ? '#10B981' : '#EF4444' }}>
                    {pendingTx.type === 'income' ? 'Të Ardhura' : 'Shpenzim'}
                </Text>
             </View>
             
             <View style={styles.actions}>
                <TouchableOpacity onPress={handleCancel} style={styles.actionBtnCancel}>
                   <XCircle size={20} color="#EF4444" />
                   <Text style={{color:'#EF4444', fontWeight:'bold', marginLeft:5}}>Anulo</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleConfirm} style={styles.actionBtnConfirm}>
                   <CheckCircle size={20} color="white" />
                   <Text style={{color:'white', fontWeight:'bold', marginLeft:5}}>Ruaj</Text>
                </TouchableOpacity>
             </View>
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputArea, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
          placeholder="p.sh. Kafe 2€..."
          placeholderTextColor={colors.textSecondary}
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity onPress={handleSend} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
           <Send size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth:1 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  
  chatArea: { flex: 1, padding: 20 },
  msgBubble: { maxWidth: '80%', padding: 14, borderRadius: 16, marginBottom: 12 },
  msgText: { fontSize: 15, lineHeight: 22 },

  previewCard: { padding: 16, borderRadius: 16, marginTop: 10, borderWidth: 1, shadowColor:'#000', shadowOpacity:0.05, elevation: 2 },
  previewTitle: { fontWeight: 'bold', marginBottom: 12 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  
  actions: { flexDirection: 'row', marginTop: 15, gap: 10 },
  actionBtnCancel: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  actionBtnConfirm: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 12, backgroundColor: '#10B981' },

  inputArea: { flexDirection: 'row', padding: 16, alignItems: 'center', borderTopWidth: 1 },
  input: { flex: 1, padding: 12, borderRadius: 24, marginRight: 10,marginBottom: 25, fontSize: 16 },
  sendBtn: { padding: 12, borderRadius: 24 },
});