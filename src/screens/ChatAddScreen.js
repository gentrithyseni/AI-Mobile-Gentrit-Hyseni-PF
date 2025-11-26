import { ArrowLeft, CheckCircle, Send, Sparkles, XCircle } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { createGoal, getGoals, updateGoal } from '../api/goals';
import { parseUserIntent } from '../api/groq';
import { createTransaction } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function ChatAddScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme(); // Përdorim temën tënde
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, text: "Përshëndetje! 👋 Unë jam asistenti yt financiar.\nMë trego çfarë shpenzove ose fitove sot.\n\nShembull: 'Pagova 25 euro për rrymë' ose 'Krijo synim për banesë'", sender: 'ai' }
  ]);
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [goals, setGoals] = useState([]);
  const scrollViewRef = useRef();

  // Load goals on mount
  React.useEffect(() => {
    if (user) {
        getGoals(user.id).then(g => setGoals(g || []));
    }
  }, [user]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userText = inputText;
    // 1. Shfaq mesazhin e userit
    const userMsg = { id: Date.now(), text: userText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setPendingAction(null);

    try {
      // 2. Pyet AI
      const result = await parseUserIntent(userText, goals);
      
      if (result) {
        setPendingAction(result);
        
        let aiText = '';
        if (result.action === 'create_goal') {
            aiText = `Dëshiron të krijosh këtë synim?\n\n🎯 Titulli: ${result.title}\n💰 Synimi: €${result.target_amount}\n💵 Aktualisht: €${result.current_amount}`;
        } else if (result.action === 'add_to_goal') {
            aiText = `Dëshiron të shtosh para tek synimi?\n\n🎯 Synimi: ${result.goal_title}\n➕ Shuma: €${result.amount}`;
        } else {
            aiText = `E kuptova! 👇\n\nShuma: €${result.amount}\nKategoria: ${result.category}\nPërshkrimi: ${result.notes}`;
        }

        const aiMsg = { 
          id: Date.now() + 1, 
          text: aiText, 
          sender: 'ai' 
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        setMessages(prev => [...prev, { id: Date.now()+1, text: "Më fal, nuk e kuptova mirë. Provo të shkruash më qartë.", sender: 'ai' }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now()+1, text: "Pata një problem me lidhjen. Provo përsëri.", sender: 'ai' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingAction || !user) return;
    try {
      if (pendingAction.action === 'create_goal') {
          await createGoal({
              user_id: user.id,
              title: pendingAction.title,
              target_amount: pendingAction.target_amount,
              current_amount: pendingAction.current_amount || 0,
              icon: pendingAction.icon || '🎯',
              color: '#3B82F6'
          });
          // Refresh goals
          getGoals(user.id).then(g => setGoals(g || []));
          setMessages(prev => [...prev, { id: Date.now(), text: "✅ Synimi u krijua me sukses!", sender: 'ai' }]);

      } else if (pendingAction.action === 'add_to_goal') {
          // Find goal by title (fuzzy match handled by AI returning exact title hopefully, or we search)
          const goal = goals.find(g => g.title.toLowerCase() === pendingAction.goal_title.toLowerCase()) || goals.find(g => pendingAction.goal_title.toLowerCase().includes(g.title.toLowerCase()));
          
          if (goal) {
              const newAmount = Number(goal.current_amount) + Number(pendingAction.amount);
              await updateGoal(goal.id, { current_amount: newAmount });
              
              // Also create a transaction record for this
              await createTransaction({
                  user_id: user.id,
                  amount: pendingAction.amount,
                  category: goal.title, // Use goal title as category
                  type: 'expense',
                  description: `Shtim në synimin: ${goal.title}`,
                  date: new Date().toISOString(),
              });
              
              // Refresh goals
              getGoals(user.id).then(g => setGoals(g || []));
              setMessages(prev => [...prev, { id: Date.now(), text: `✅ U shtuan €${pendingAction.amount} tek "${goal.title}"!`, sender: 'ai' }]);
          } else {
              setMessages(prev => [...prev, { id: Date.now(), text: `❌ Nuk e gjeta synimin "${pendingAction.goal_title}".`, sender: 'ai' }]);
          }

      } else {
          // Normal transaction
          const tx = {
            user_id: user.id,
            amount: pendingAction.amount,
            category: pendingAction.category,
            type: pendingAction.type,
            description: pendingAction.notes,
            date: new Date().toISOString(),
          };
          await createTransaction(tx);
          setMessages(prev => [...prev, { id: Date.now(), text: "✅ Transaksioni u ruajt me sukses!", sender: 'ai' }]);
      }
      
      setPendingAction(null);
    } catch (e) {
      alert("Gabim gjatë ruajtjes: " + e.message);
    }
  };

  const handleCancel = () => {
    setPendingAction(null);
    setMessages(prev => [...prev, { id: Date.now(), text: "Në rregull, e anulova.", sender: 'ai' }]);
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
        {pendingAction && (
          <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
             <Text style={[styles.previewTitle, { color: colors.text }]}>Konfirmo Veprimin</Text>
             
             {pendingAction.action === 'create_goal' ? (
                 <>
                    <View style={styles.previewRow}>
                        <Text style={{ color: colors.textSecondary }}>Titulli:</Text>
                        <Text style={{ fontWeight: 'bold', color: colors.text }}>{pendingAction.title}</Text>
                    </View>
                    <View style={styles.previewRow}>
                        <Text style={{ color: colors.textSecondary }}>Synimi:</Text>
                        <Text style={{ fontWeight: 'bold', color: colors.text }}>€{pendingAction.target_amount}</Text>
                    </View>
                    <View style={styles.previewRow}>
                        <Text style={{ color: colors.textSecondary }}>Fillimi:</Text>
                        <Text style={{ fontWeight: 'bold', color: colors.text }}>€{pendingAction.current_amount}</Text>
                    </View>
                 </>
             ) : pendingAction.action === 'add_to_goal' ? (
                 <>
                    <View style={styles.previewRow}>
                        <Text style={{ color: colors.textSecondary }}>Synimi:</Text>
                        <Text style={{ fontWeight: 'bold', color: colors.text }}>{pendingAction.goal_title}</Text>
                    </View>
                    <View style={styles.previewRow}>
                        <Text style={{ color: colors.textSecondary }}>Shto:</Text>
                        <Text style={{ fontWeight: 'bold', color: '#10B981' }}>+ €{pendingAction.amount}</Text>
                    </View>
                 </>
             ) : (
                 <>
                     <View style={styles.previewRow}>
                        <Text style={{ color: colors.textSecondary }}>Shuma:</Text>
                        <Text style={{ fontWeight: 'bold', color: colors.text }}>€{pendingAction.amount}</Text>
                     </View>
                     <View style={styles.previewRow}>
                        <Text style={{ color: colors.textSecondary }}>Kategoria:</Text>
                        <Text style={{ fontWeight: 'bold', color: colors.text }}>{pendingAction.category}</Text>
                     </View>
                     <View style={styles.previewRow}>
                        <Text style={{ color: colors.textSecondary }}>Lloji:</Text>
                        <Text style={{ fontWeight: 'bold', color: pendingAction.type === 'income' ? '#10B981' : '#EF4444' }}>
                            {pendingAction.type === 'income' ? 'Të Ardhura' : 'Shpenzim'}
                        </Text>
                     </View>
                 </>
             )}
             
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