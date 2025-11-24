import { BrainCircuit, LogOut, Moon, PlusCircle, Sparkles, Sun, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { getFinancialAdvice } from '../api/groq';
import { getTransactions } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SimplePieChart = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.y, 0);
  if (total === 0) return <Text style={{textAlign:'center', color:'#999', margin: 20}}>S'ka të dhëna për grafikun</Text>;

  let startAngle = 0;
  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg width={150} height={150} viewBox="0 0 100 100">
        <G rotation="-90" origin="50, 50">
          {data.map((slice, index) => {
            const sliceAngle = (slice.y / total) * 360;
            const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
            const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
            const x2 = 50 + 50 * Math.cos(Math.PI * (startAngle + sliceAngle) / 180);
            const y2 = 50 + 50 * Math.sin(Math.PI * (startAngle + sliceAngle) / 180);
            const largeArc = sliceAngle > 180 ? 1 : 0;
            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
            startAngle += sliceAngle;
            return <Path key={index} d={pathData} fill={slice.color} stroke="white" strokeWidth="2" />;
          })}
        </G>
      </Svg>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 15, gap: 10 }}>
        {data.map((item, i) => (
           <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
             <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color, marginRight: 5 }} />
             <Text style={{ fontSize: 10, color: '#555' }}>{item.x}</Text>
           </View>
        ))}
      </View>
    </View>
  );
};

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [aiAdvice, setAiAdvice] = useState({ text: 'Duke analizuar...', loading: true });

  const goals = [
    { id: 1, title: 'Laptop', target: 1500, current: 450, icon: '💻', color: '#3B82F6' },
    { id: 2, title: 'Pushime', target: 800, current: 200, icon: '🏖️', color: '#F97316' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      console.error('Sign out error', e);
    }
  };

  const loadData = async () => {
    if (!user) return;
    try {
      setRefreshing(true);
      const tx = await getTransactions(user.id);
      setTransactions(tx || []);
      
      if (tx && tx.length > 0) {
        const totalIncome = tx.filter(t => ['Paga', 'Income', 'Te Ardhura'].includes(t.category)).reduce((sum, t) => sum + Number(t.amount), 0);
        const totalExpense = tx.filter(t => !['Paga', 'Income', 'Te Ardhura'].includes(t.category)).reduce((sum, t) => sum + Number(t.amount), 0);
        const balance = totalIncome - totalExpense;
        
        setAiAdvice(prev => ({ ...prev, loading: true }));
        const advice = await getFinancialAdvice(totalIncome, totalExpense, balance, tx.slice(0, 5));
        setAiAdvice({ text: advice, loading: false });
      } else {
        setAiAdvice({ text: "Shto transaksione për të marrë këshilla!", loading: false });
      }

    } catch (e) {
      console.error("Gabim:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = navigation.addListener('focus', loadData);
    return unsubscribe;
  }, [navigation, user]);

  const totals = useMemo(() => {
    const inc = transactions.filter(t => ['Income', 'Paga', 'Te Ardhura'].includes(t.category)).reduce((acc, t) => acc + Number(t.amount), 0);
    const exp = transactions.filter(t => !['Income', 'Paga', 'Te Ardhura'].includes(t.category)).reduce((acc, t) => acc + Number(t.amount), 0);
    return { income: inc, expense: exp, balance: inc - exp };
  }, [transactions]);

  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => !['Income', 'Paga', 'Te Ardhura'].includes(t.category));
    const byCat = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];
    return Object.keys(byCat).map((key, i) => ({
      x: key,
      y: byCat[key],
      color: colors[i % colors.length]
    }));
  }, [transactions]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            {/* Dark Mode Toggle */}
            <TouchableOpacity onPress={toggleTheme} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
                {isDarkMode ? <Sun size={20} color="white" /> : <Moon size={20} color="white" />}
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSignOut} style={{ padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 }}>
                <LogOut size={20} color="white" />
            </TouchableOpacity>
        </View>
        <View style={styles.headerTop}>
           <Wallet size={80} color="rgba(255,255,255,0.1)" style={{position:'absolute', right: 0, top: -10}} />
           <Text style={styles.balanceLabel}>Bilanci Aktual</Text>
           <Text style={styles.balanceValue}>€ {totals.balance.toFixed(2)}</Text>
        </View>
        <View style={styles.statsRow}>
           <View style={styles.statBox}>
              <View style={[styles.iconCircle, {backgroundColor: 'rgba(16, 185, 129, 0.2)'}]}>
                <TrendingUp size={18} color="#6EE7B7" />
              </View>
              <View>
                 <Text style={styles.statLabel}>Të Ardhura</Text>
                 <Text style={styles.statValue}>€ {totals.income.toFixed(2)}</Text>
              </View>
           </View>
           <View style={styles.statBox}>
              <View style={[styles.iconCircle, {backgroundColor: 'rgba(239, 68, 68, 0.2)'}]}>
                <TrendingDown size={18} color="#FCA5A5" />
              </View>
              <View>
                 <Text style={styles.statLabel}>Shpenzime</Text>
                 <Text style={styles.statValue}>€ {totals.expense.toFixed(2)}</Text>
              </View>
           </View>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{paddingBottom: 100}} 
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} tintColor={colors.primary} />}
      >
        {/* Gemini Card */}
        <View style={[styles.aiCard, { backgroundColor: colors.card }]}>
           <View style={{flexDirection:'row', alignItems:'center', marginBottom: 5}}>
             <BrainCircuit size={18} color="#9333EA" />
             <Text style={styles.aiTitle} > GROQ AI Ndihmesi Financiar </Text>
           </View>
           <Text style={[styles.aiText, { color: colors.textSecondary }]}>
             {aiAdvice.loading ? 'Duke analizuar...' : aiAdvice.text}
           </Text>
        </View>

        <View style={styles.section}>
            <View style={{flexDirection:'row', alignItems:'center', marginBottom:10}}>
                <Target size={30} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: colors.text }]}> Synimet</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{paddingLeft: 20}}>
                {goals.map(g => {
                   const pct = Math.min(100, Math.round((g.current/g.target)*100));
                   return (
                     <View key={g.id} style={[styles.goalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                           <Text style={{fontSize:20}}>{g.icon}</Text>
                           <Text style={{fontSize:15, fontWeight:'bold', backgroundColor: isDarkMode ? '#374151' : '#F3F4F6', color: colors.text, padding:3, borderRadius:5}}>{pct}%</Text>
                        </View>
                        <Text style={[styles.goalTitle, { color: colors.text }]}>{g.title}</Text>
                        <Text style={styles.goalSub}>€{g.current} / €{g.target}</Text>
                        <View style={{height:4, backgroundColor: isDarkMode ? '#374151' : '#E5E7EB', borderRadius:2, marginTop:5}}>
                           <View style={{width:`${pct}%`, backgroundColor: g.color, height:4, borderRadius:2}} />
                        </View>
                     </View>
                   );
                })}
            </ScrollView>
        </View>

        <View style={styles.section}>
             <Text style={[styles.sectionTitle, {marginLeft: 20, color: colors.text}]}>Shpenzimet sipas Kategorisë</Text>
             <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                <SimplePieChart data={chartData} />
             </View>
        </View>

        <View style={styles.section}>
           <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginHorizontal: 20, marginBottom: 10}}>
             <Text style={[styles.sectionTitle, { color: colors.text }]}>Transaksionet e Fundit</Text>
             <View style={{flexDirection:'row', gap: 15}}>
                <TouchableOpacity onPress={() => navigation.navigate('AllTransactions')}>
                    <Text style={{color: colors.textSecondary, fontWeight:'600'}}>Shiko të gjitha</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('AddTransaction')}>
                    <Text style={{color: colors.primary, fontWeight:'600'}}>Shto +</Text>
                </TouchableOpacity>
             </View>
           </View>
           
           {transactions.length === 0 && <Text style={{marginLeft:20, color: colors.textSecondary}}>Nuk ka transaksione ende.</Text>}

           {transactions.slice(0, 5).map(item => (
             <TouchableOpacity 
                key={item.id} 
                style={[styles.txItem, { backgroundColor: colors.card }]}
                onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
             >
                <View style={{flexDirection:'row', alignItems:'center'}}>
                   <View style={[styles.txIcon, {backgroundColor: ['Income','Paga','Te Ardhura'].includes(item.category) ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5') : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')}]}>
                      {['Income','Paga','Te Ardhura'].includes(item.category) ? <TrendingUp size={16} color="#059669"/> : <TrendingDown size={16} color="#DC2626"/>}
                   </View>
                   <View>
                      <Text style={[styles.txCategory, { color: colors.text }]}>{item.category}</Text>
                      <Text style={styles.txDate}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                   </View>
                </View>
                <Text style={{fontWeight:'bold', color: ['Income','Paga','Te Ardhura'].includes(item.category) ? '#059669' : '#DC2626'}}>
                   {['Income','Paga','Te Ardhura'].includes(item.category) ? '+' : '-'} €{item.amount}
                </Text>
             </TouchableOpacity>
           ))}
        </View>
      </ScrollView>

      {/* FLOATING ACTION BUTTONS (Shtuar Chat) */}
      <View style={styles.fabContainer}>
        {/* AI Chat Button */}
        <TouchableOpacity 
          style={[styles.fab, {backgroundColor: '#7C3AED', marginBottom: 15}]} 
          onPress={() => navigation.navigate('ChatAdd')}
        >
           <Sparkles size={24} color="white" />
        </TouchableOpacity>

        {/* Manual Add Button */}
        <TouchableOpacity 
          style={[styles.fab, { backgroundColor: colors.primary }]} 
          onPress={() => navigation.navigate('AddTransaction')}
        >
           <PlusCircle size={30} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 30, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingTop: 50 },
  balanceLabel: { color: '#BFDBFE', fontSize: 14, fontWeight: '500' },
  balanceValue: { color: 'white', fontSize: 32, fontWeight: 'bold', marginVertical: 5 },
  headerTop: { marginBottom: 20 },
  statsRow: { flexDirection: 'row', gap: 15 },
  statBox: { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconCircle: { padding: 6, borderRadius: 20 },
  statLabel: { color: '#BFDBFE', fontSize: 10 },
  statValue: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  
  aiCard: { margin: 20, marginTop: 10, padding: 15, borderRadius: 16, shadowColor:'#000', shadowOpacity:0.05, elevation:3, borderLeftWidth: 4, borderLeftColor: '#9333EA' },
  aiTitle: { fontWeight: 'bold', color: '#9333EA', fontSize: 16 },
  aiText: { color: '#4B5563', fontSize: 13, marginTop: 4, lineHeight: 18 },

  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 10 },
  
  goalCard: { backgroundColor: 'white', padding: 12, borderRadius: 12, width: 140, marginRight: 10, borderWidth: 1, borderColor: '#F3F4F6' },
  goalTitle: { fontWeight: '600', color: '#374151', fontSize: 13, marginTop: 5 },
  goalSub: { color: '#9CA3AF', fontSize: 11, marginBottom: 5 },
  
  chartCard: { marginHorizontal: 20, borderRadius: 16, padding: 10, elevation: 2 },

  txItem: { marginHorizontal: 20, marginBottom: 8, padding: 12, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor:'#000', shadowOpacity:0.03, elevation: 1 },
  txIcon: { padding: 8, borderRadius: 20, marginRight: 12 },
  txCategory: { fontWeight: '600', color: '#374151', fontSize: 14 },
  txDate: { color: '#9CA3AF', fontSize: 11 },

  // STIL I RI PER BUTONAT
  fabContainer: { position: 'absolute', bottom: 20, right: 20, alignItems: 'center' },
  fab: { 
    width: 56, 
    height: 56, 
    borderRadius: 28, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 5, 
    shadowColor: '#000', 
    shadowOpacity: 0.3, 
    shadowOffset: {width:0, height:4} 
  }
});