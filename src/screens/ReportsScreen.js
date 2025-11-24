import { ArrowDownCircle, ArrowUpCircle, Calendar } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { getTransactions } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

// --- 1. Bar Chart i Rregulluar ---
const SimpleBarChart = ({ income, expense, textColor }) => {
  const maxVal = Math.max(income, expense, 1) * 1.2;
  const svgHeight = 260; // E rrita lartësinë që të zërë tekstin poshtë
  const barAreaHeight = 180; 
  const barWidth = 50;
  const startY = 210; // Fillimi i poshtëm i shtyllave

  const incomeHeight = (income / maxVal) * barAreaHeight;
  const expenseHeight = (expense / maxVal) * barAreaHeight;

  const incomeText = `€ ${income.toFixed(2)}`;
  const expenseText = `€ ${expense.toFixed(2)}`;

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Svg width={280} height={svgHeight}>
        {/* Income Bar */}
        <Rect
          x="60"
          y={startY - incomeHeight}
          width={barWidth}
          height={incomeHeight}
          fill="#10B981"
          rx="6"
        />
        <SvgText
          x="85"
          y={startY - incomeHeight - 10}
          fill="#10B981"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          {incomeText}
        </SvgText>
        <SvgText x="85" y={startY + 25} fill={textColor} fontSize="14" textAnchor="middle" fontWeight="500">Të Ardhura</SvgText>

        {/* Expense Bar */}
        <Rect
          x="170"
          y={startY - expenseHeight}
          width={barWidth}
          height={expenseHeight}
          fill="#EF4444"
          rx="6"
        />
        <SvgText
          x="195"
          y={startY - expenseHeight - 10} 
          fill="#EF4444"
          fontSize="14"
          fontWeight="bold"
          textAnchor="middle"
        >
          {expenseText}
        </SvgText>
        <SvgText x="195" y={startY + 25} fill={textColor} fontSize="14" textAnchor="middle" fontWeight="500">Shpenzime</SvgText>
      </Svg>
    </View>
  );
};

// --- 2. Line Chart (Trendi Mujor - 6 Muajt e Fundit) ---
const SimpleLineChart = ({ data, textColor, lineColor }) => {
  // Tani data vjen gjithmonë me 6 muaj, kështu që heqim kontrollin e "S'ka të dhëna"
  const width = 320;
  const height = 180;
  const paddingX = 30;
  const paddingY = 30;
  
  const maxVal = Math.max(...data.map(d => d.value), 10); // Min max 10 që grafiku mos të duket bosh
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 2 * paddingX) + paddingX;
    const y = height - (d.value / maxVal) * (height - 2 * paddingY) - paddingY;
    return { x, y, label: d.label, value: d.value };
  });

  let pathD = `M ${points[0].x} ${points[0].y}`;
  points.slice(1).forEach(p => {
    pathD += ` L ${p.x} ${p.y}`;
  });

  return (
    <View style={{ alignItems: 'center', marginVertical: 20 }}>
      <Svg width={width} height={height + 40}>
        {/* Vijat horizontale për ndihmë */}
        <Line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke={textColor} strokeOpacity="0.1" />
        <Line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke={textColor} strokeOpacity="0.1" />

        <Path d={pathD} stroke={lineColor} strokeWidth="3" fill="none" />
        
        {points.map((p, i) => (
          <G key={i}>
            <Circle cx={p.x} cy={p.y} r="5" fill="white" stroke={lineColor} strokeWidth="2" />
            
            {/* Muaji poshtë */}
            <SvgText x={p.x} y={height + 15} fill={textColor} fontSize="10" textAnchor="middle">
              {p.label}
            </SvgText>
            
            {/* Vlera sipër pikës (vetëm nëse > 0 ose është pika e fundit) */}
            {(p.value > 0 || i === points.length - 1) && (
                <SvgText x={p.x} y={p.y - 12} fill={textColor} fontSize="10" fontWeight="bold" textAnchor="middle">
                  {p.value.toFixed(0)}
                </SvgText>
            )}
          </G>
        ))}
      </Svg>
    </View>
  );
};

// --- 3. Pie Chart ---
const SimplePieChart = ({ data }) => {
  const total = data.reduce((acc, item) => acc + item.y, 0);
  if (total === 0) return <Text style={{ textAlign: 'center', color: '#999', margin: 20 }}>S'ka të dhëna</Text>;

  let startAngle = 0;
  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Svg width={180} height={180} viewBox="0 0 100 100">
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
    </View>
  );
};

export default function ReportsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      const tx = await getTransactions(user.id);
      setTransactions(tx || []);
      setLoading(false);
    }
    const unsub = navigation.addListener('focus', load);
    load();
    return unsub;
  }, [navigation, user]);

  // --- Llogaritjet ---

  const chartData = useMemo(() => {
    const expenses = transactions.filter(t => !['Income', 'Paga', 'Te Ardhura'].includes(t.category));
    const byCat = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});
    const colors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];
    return Object.keys(byCat)
      .map((key, i) => ({
        x: key,
        y: byCat[key],
        color: colors[i % colors.length]
      }))
      .sort((a, b) => b.y - a.y);
  }, [transactions]);

  // 2. Trend Data (Fix: Gjenerojmë 6 muajt e fundit edhe nëse janë bosh)
  const monthlyTrendData = useMemo(() => {
    const expenses = transactions.filter(t => !['Income', 'Paga', 'Te Ardhura'].includes(t.category));
    
    // 1. Grupojmë transaksionet ekzistuese
    const grouped = {};
    expenses.forEach(t => {
      const date = new Date(t.date);
      const monthKey = `${date.getMonth() + 1}/${date.getFullYear().toString().substr(2,2)}`; // "11/25"
      grouped[monthKey] = (grouped[monthKey] || 0) + Number(t.amount);
    });

    // 2. Gjenerojmë listën e 6 muajve të fundit (që të mos dalë bosh)
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = `${d.getMonth() + 1}/${d.getFullYear().toString().substr(2,2)}`;
        last6Months.push({
            label: key,
            value: grouped[key] || 0 // Nëse s'ka të dhëna, vër 0
        });
    }

    return last6Months;
  }, [transactions]);

  const totalExpense = transactions
    .filter(t => !['Income', 'Paga', 'Te Ardhura'].includes(t.category))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalIncome = transactions
    .filter(t => ['Income', 'Paga', 'Te Ardhura'].includes(t.category))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;

  const dailyAverage = useMemo(() => {
      const currentMonthExpenses = transactions.filter(t => {
          const d = new Date(t.date);
          const now = new Date();
          return !['Income', 'Paga', 'Te Ardhura'].includes(t.category) && 
                 d.getMonth() === now.getMonth() && 
                 d.getFullYear() === now.getFullYear();
      });
      const total = currentMonthExpenses.reduce((acc, t) => acc + Number(t.amount), 0);
      const dayOfMonth = new Date().getDate(); 
      return dayOfMonth > 0 ? total / dayOfMonth : 0;
  }, [transactions]);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Pasqyra Financiare</Text>

      {/* Summary Cards Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
          <View style={{flexDirection:'row', alignItems:'center', marginBottom:5}}>
             <ArrowUpCircle size={18} color="#10B981" />
             <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}> Të Ardhura</Text>
          </View>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>€ {totalIncome.toFixed(2)}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
          <View style={{flexDirection:'row', alignItems:'center', marginBottom:5}}>
             <ArrowDownCircle size={18} color="#EF4444" />
             <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}> Shpenzime</Text>
          </View>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>€ {totalExpense.toFixed(2)}</Text>
        </View>
      </View>

      {/* Net Balance & Daily Average */}
      <View style={styles.summaryRow}>
          <View style={[styles.netCard, { backgroundColor: colors.primary, flex: 1 }]}>
            <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12}}>Bilanci Neto</Text>
            <Text style={{color: 'white', fontSize: 22, fontWeight: 'bold'}}>€ {netBalance.toFixed(2)}</Text>
          </View>
          <View style={[styles.netCard, { backgroundColor: colors.card, flex: 1, borderWidth:1, borderColor: colors.border }]}>
            <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                <Calendar size={14} color={colors.textSecondary}/>
                <Text style={{color: colors.textSecondary, fontSize: 12}}>Mesatarja Ditore</Text>
            </View>
            <Text style={{color: colors.text, fontSize: 22, fontWeight: 'bold'}}>€ {dailyAverage.toFixed(2)}</Text>
          </View>
      </View>

      {/* Bar Chart Section */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Krahasimi Total</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : <SimpleBarChart income={totalIncome} expense={totalExpense} textColor={colors.text} />}
      </View>

      {/* Monthly Trend Line Chart */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Trendi 6-Mujor (Shpenzimet)</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : 
            <SimpleLineChart data={monthlyTrendData} textColor={colors.text} lineColor={colors.primary} />
        }
      </View>

      {/* Pie Chart & List Section */}
      <View style={[styles.card, { marginBottom: 50, backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Top Kategoritë</Text>
        
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <SimplePieChart data={chartData} />
            
            <View style={{ marginTop: 10 }}>
                {chartData.map((item, index) => (
                    <View key={index} style={[styles.catRow, { borderBottomColor: colors.border }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: 10 }} />
                            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{item.x}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>€ {item.y.toFixed(2)}</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{Math.round((item.y / totalExpense) * 100)}%</Text>
                        </View>
                    </View>
                ))}
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 15 },
  summaryCard: { flex: 1, padding: 15, borderRadius: 16, borderWidth: 1, borderBottomWidth: 4 },
  summaryLabel: { fontSize: 12, fontWeight: '600' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },

  netCard: { padding: 15, borderRadius: 16, shadowOpacity: 0.1, elevation: 2, justifyContent:'center' },

  card: { borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});