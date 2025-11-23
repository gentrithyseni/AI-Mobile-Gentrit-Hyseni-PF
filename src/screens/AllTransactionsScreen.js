import { ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getTransactions } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';

export default function AllTransactionsScreen({ navigation }) {
  const { user } = useAuth();
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
        style={styles.txItem}
        onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
      >
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <View style={[styles.txIcon, {backgroundColor: isIncome ? '#D1FAE5' : '#FEE2E2'}]}>
                {isIncome ? <TrendingUp size={20} color="#059669"/> : <TrendingDown size={20} color="#DC2626"/>}
            </View>
            <View>
                <Text style={styles.txCategory}>{item.category}</Text>
                <Text style={styles.txDesc}>{item.description}</Text>
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Të gjitha Transaksionet</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{marginTop: 50}} />
      ) : (
        <FlatList
            data={transactions}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{padding: 20}}
            ListEmptyComponent={<Text style={{textAlign:'center', color:'#999', marginTop: 50}}>Nuk ka transaksione.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingHorizontal: 20, paddingBottom: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  backBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20, marginRight: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  
  txItem: { backgroundColor: 'white', marginBottom: 10, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor:'#000', shadowOpacity:0.03, elevation: 1 },
  txIcon: { padding: 10, borderRadius: 20, marginRight: 12 },
  txCategory: { fontWeight: '600', color: '#374151', fontSize: 15 },
  txDesc: { color: '#6B7280', fontSize: 12, marginBottom: 2 },
  txDate: { color: '#9CA3AF', fontSize: 11 },
  amount: { fontWeight: 'bold', fontSize: 16 }
});
