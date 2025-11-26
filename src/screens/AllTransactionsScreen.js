import { ArrowLeft, Search, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getTransactions } from '../api/transactions';
import { CATEGORY_ICONS } from '../constants/categories';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export default function AllTransactionsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors, isDarkMode } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

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

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            t.category?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? t.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [transactions, searchQuery, selectedCategory]);

  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats);
  }, [transactions]);

  const renderItem = ({ item }) => {
    const isIncome = ['Income', 'Paga', 'Te Ardhura', 'Dhurata'].includes(item.category) || item.type === 'income';
    const IconComponent = CATEGORY_ICONS[item.category]?.icon || CATEGORY_ICONS['Tjetër'].icon;
    const iconColor = CATEGORY_ICONS[item.category]?.color || CATEGORY_ICONS['Tjetër'].color;

    return (
      <TouchableOpacity 
        style={[styles.txItem, { backgroundColor: colors.card }]}
        onPress={() => navigation.navigate('AddTransaction', { transaction: item })}
      >
        <View style={{flexDirection:'row', alignItems:'center'}}>
            <View style={[styles.txIcon, {backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#F3F4F6'}]}>
                <IconComponent size={20} color={iconColor} />
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

      {/* Search & Filter Section */}
      <View style={{ padding: 15, paddingBottom: 5 }}>
        <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Search size={20} color={colors.textSecondary} style={{marginRight: 10}} />
            <TextInput 
                style={{flex: 1, color: colors.text, fontSize: 16}}
                placeholder="Kërko transaksione..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginTop: 15, marginBottom: 5}}>
            <TouchableOpacity 
                onPress={() => setSelectedCategory(null)}
                style={[
                    styles.filterChip, 
                    { backgroundColor: selectedCategory === null ? colors.primary : colors.card, borderColor: colors.border },
                    selectedCategory === null && { borderWidth: 0 }
                ]}
            >
                <Text style={{color: selectedCategory === null ? 'white' : colors.text, fontWeight: '500'}}>Të gjitha</Text>
            </TouchableOpacity>
            
            {uniqueCategories.map(cat => (
                <TouchableOpacity 
                    key={cat}
                    onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                    style={[
                        styles.filterChip, 
                        { backgroundColor: selectedCategory === cat ? colors.primary : colors.card, borderColor: colors.border },
                        selectedCategory === cat && { borderWidth: 0 }
                    ]}
                >
                    <Text style={{color: selectedCategory === cat ? 'white' : colors.text, fontWeight: '500'}}>{cat}</Text>
                </TouchableOpacity>
            ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{marginTop: 50}} />
      ) : (
        <FlatList
            data={filteredTransactions}
            renderItem={renderItem}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{padding: 20, paddingTop: 5}}
            ListEmptyComponent={<Text style={{textAlign:'center', color: colors.textSecondary, marginTop: 50}}>Nuk u gjet asnjë transaksion.</Text>}
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
  
  searchBar: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, borderWidth: 1 },

  txItem: { marginBottom: 10, padding: 16, borderRadius: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor:'#000', shadowOpacity:0.03, elevation: 1 },
  txIcon: { padding: 10, borderRadius: 20, marginRight: 12 },
  txCategory: { fontWeight: '600', fontSize: 15 },
  txDesc: { fontSize: 12, marginBottom: 2 },
  txDate: { color: '#9CA3AF', fontSize: 11 },
  amount: { fontWeight: 'bold', fontSize: 16 }
});
