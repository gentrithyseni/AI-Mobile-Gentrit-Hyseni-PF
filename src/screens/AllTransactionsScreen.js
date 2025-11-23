import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTransactions } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function AllTransactionsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const tx = await getTransactions(user.id);
        // Sort by date descending
        const sorted = (tx || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(sorted);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [user, navigation]);

  const renderItem = ({ item }) => {
    const isIncome = ['Income', 'Paga', 'Te Ardhura', 'Dhurata'].includes(item.category) || item.type === 'income';
    return (
      <TouchableOpacity 
        style={[styles.txItem, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
      >
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <View style={[styles.txIcon, {backgroundColor: isIncome ? (isDarkMode ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5') : (isDarkMode ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2')}]}>
                {isIncome ? <TrendingUp size={20} color="#059669"/> : <TrendingDown size={20} color="#DC2626"/>}
            </View>
            <View>
                <Text style={[styles.txCategory, { color: colors.text }]}>{item.category}</Text>
                <Text style={[styles.txDesc, { color: colors.textSecondary }]}>{item.description}</Text>
                <Text style={styles.txDate}>{new Date(item.date).toLocaleDateString()} {new Date(item.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
            </View>
        </View>
        <Text style={[styles.amount, {color: isIncome ? '#059669' : '#DC2626'}]}>
            {isIncome ? '+' : '-'} €{Number(item.amount).toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: isDarkMode ? colors.background : '#F3F4F6' }]}>
            <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Të gjitha Transaksionet</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{padding: 20}}
            ListEmptyComponent={<Text style={{textAlign:'center', color: colors.textSecondary, marginTop: 50}}>Nuk ka transaksione.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1 },
  backBtn: { padding: 8, borderRadius: 20, marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  
  txItem: { marginBottom: 10, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor:'#000', shadowOpacity:0.03, elevation: 1 },
  txIcon: { padding: 10, borderRadius: 20, marginRight: 12 },
  txCategory: { fontWeight: '600', fontSize: 15 },
  txDesc: { fontSize: 12, marginBottom: 2 },
  txDate: { color: '#9CA3AF', fontSize: 11 },
  amount: { fontWeight: 'bold', fontSize: 16 }
});
