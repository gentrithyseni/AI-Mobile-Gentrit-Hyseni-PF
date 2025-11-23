import { LogOut } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { getTransactions } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';

// Simple Bar Chart Component
const SimpleBarChart = ({ income, expense }) => {
  const maxVal = Math.max(income, expense, 1); // Avoid division by zero
  const barHeight = 200;
  const barWidth = 60;
  
  const incomeHeight = (income / maxVal) * barHeight;
  const expenseHeight = (expense / maxVal) * barHeight;

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg width={200} height={240}>
        {/* Income Bar */}
        <Rect
          x="25"
          y={barHeight - incomeHeight}
          width={barWidth}
          height={incomeHeight}
          fill="#10B981"
          rx="5"
        />
        <SvgText
          x="55"
          y={barHeight - incomeHeight - 10}
          fill="#10B981"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          €{income}
        </SvgText>
        <SvgText x="55" y={barHeight + 20} fill="#374151" fontSize="14" textAnchor="middle">Të Ardhura</SvgText>

        {/* Expense Bar */}
        <Rect
          x="115"
          y={barHeight - expenseHeight}
          width={barWidth}
          height={expenseHeight}
          fill="#EF4444"
          rx="5"
        />
        <SvgText
          x="145"
          y={barHeight - expenseHeight - 10}
          fill="#EF4444"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          €{expense}
        </SvgText>
        <SvgText x="145" y={barHeight + 20} fill="#374151" fontSize="14" textAnchor="middle">Shpenzime</SvgText>
      </Svg>
    </View>
  );
};

// Simple Chart Component
const SimplePieChart = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.y, 0);
  if (total === 0) return <Text style={{textAlign:'center', color:'#999', margin: 20}}>S'ka të dhëna</Text>;

  let startAngle = 0;
  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg width={200} height={200} viewBox="0 0 100 100">
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
      {/* Legend */}
      <View style={{ marginTop: 20 }}>
        {data.map((item, i) => (
           <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
             <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 8 }} />
             <Text style={{ fontSize: 14, color: '#374151' }}>{item.x} ({Math.round((item.y/total)*100)}%, {item.y} €)</Text>
           </View>
        ))}
      </View>
    </View>
  );
};

export default function ReportsScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
        if(!user) return;
        setLoading(true);
        const tx = await getTransactions(user.id);
        setTransactions(tx || []);
        setLoading(false);
    }
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation, user]);

  const chartData = useMemo(() => {
    // Marrim vetem shpenzimet
    const expenses = transactions.filter(t => !['Income', 'Paga', 'Te Ardhura'].includes(t.category));
    const byCat = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    return Object.keys(byCat).map((key, i) => ({
      x: key,
      y: byCat[key],
      color: colors[i % colors.length]
    }));
  }, [transactions]);

  const totalExpense = transactions
    .filter(t => !['Income', 'Paga', 'Te Ardhura'].includes(t.category))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalIncome = transactions
    .filter(t => ['Income', 'Paga', 'Te Ardhura'].includes(t.category))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  return (
    <ScrollView style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
        <Text style={styles.title}>Raportet Financiare</Text>
        <TouchableOpacity onPress={signOut} style={{ padding: 8, backgroundColor: '#E5E7EB', borderRadius: 20 }}>
            <LogOut size={20} color="#EF4444" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shpenzimet Totale</Text>
        <Text style={styles.totalValue}>€ {totalExpense.toFixed(2)}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Të Ardhura vs Shpenzime</Text>
        {loading ? <ActivityIndicator color="#2563EB" /> : <SimpleBarChart income={totalIncome} expense={totalExpense} />}
      </View>

      <View style={[styles.card, {marginBottom: 50}]}>
        <Text style={styles.cardTitle}>Ndarja sipas Kategorisë</Text>
        {loading ? <ActivityIndicator color="#2563EB" /> : <SimplePieChart data={chartData} />}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#6B7280', marginBottom: 10 },
  totalValue: { fontSize: 36, fontWeight: 'bold', color: '#EF4444' }
});