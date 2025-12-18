import { ArrowDownCircle, ArrowUpCircle, Calendar, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, X } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { getTransactions } from '../api/transactions';
import { ResponsiveContainer } from '../components/ResponsiveContainer';
import { CATEGORY_ICONS, DEFAULT_INCOME_CATEGORIES } from '../constants/categories';
import { useAuth } from '../contexts/AuthContext';
import { useFilter } from '../contexts/FilterContext';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/financeCalculations';

// --- 1. Bar Chart i Rregulluar ---
const SimpleBarChart = ({ income, expense, textColor }) => {
  const maxVal = Math.max(income, expense, 1) * 1.2;
  const svgHeight = 260; // E rrita lartësinë që të zërë tekstin poshtë
  const barAreaHeight = 180; 
  const barWidth = 50;
  const startY = 210; // Fillimi i poshtëm i shtyllave

  const incomeHeight = (income / maxVal) * barAreaHeight;
  const expenseHeight = (expense / maxVal) * barAreaHeight;

  const incomeText = `€ ${formatCurrency(income)}`;
  const expenseText = `€ ${formatCurrency(expense)}`;

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

// --- 2. Calendar View ---
const CalendarView = ({ date, transactions, onSelectDay, selectedDay, colors }) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayObj = new Date(year, month, 1);
  let startDay = firstDayObj.getDay(); // 0=Sun, 1=Mon
  
  // Adjust to make Monday first (0)
  // Sun(0) -> 6, Mon(1) -> 0
  startDay = (startDay === 0 ? 6 : startDay - 1);

  const days = [];
  for(let i=0; i<startDay; i++) days.push(null);
  for(let i=1; i<=daysInMonth; i++) days.push(i);

  const weekDays = ['Hë', 'Ma', 'Më', 'En', 'Pr', 'Sh', 'Di'];

  const getDayExpenses = (day) => {
    if(!day) return { expense: 0, income: 0 };
    const dayTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });

    const expense = dayTx.filter(t => !DEFAULT_INCOME_CATEGORIES.includes(t.category)).reduce((acc, t) => acc + Number(t.amount), 0);
    const income = dayTx.filter(t => DEFAULT_INCOME_CATEGORIES.includes(t.category)).reduce((acc, t) => acc + Number(t.amount), 0);
    
    return { expense, income };
  };

  return (
    <View>
      <Text style={{fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 10, marginLeft: 5}}>Kalendari i Transaksioneve</Text>
      <View style={{flexDirection:'row', justifyContent:'space-around', marginBottom: 10}}>
        {weekDays.map(d => <Text key={d} style={{color: colors.textSecondary, width: 30, textAlign:'center', fontSize: 12}}>{d}</Text>)}
      </View>
      <View style={{flexDirection:'row', flexWrap:'wrap'}}>
        {days.map((day, i) => {
            const { expense, income } = getDayExpenses(day);
            const hasExpense = expense > 0;
            const hasIncome = income > 0;
            const isSelected = selectedDay === day;
            
            return (
                <TouchableOpacity 
                    key={i} 
                    disabled={!day}
                    onPress={() => onSelectDay(day)}
                    style={{
                        width: '14.28%', 
                        aspectRatio: 1, 
                        justifyContent:'center', 
                        alignItems:'center',
                        padding: 2
                    }}
                >
                    {day && (
                        <View style={{
                            width: 32, 
                            height: 32, 
                            borderRadius: 16, 
                            justifyContent:'center', 
                            alignItems:'center',
                            backgroundColor: isSelected ? colors.primary : 'transparent',
                            borderWidth: (hasExpense || hasIncome) && !isSelected ? 1 : 0,
                            borderColor: colors.border
                        }}>
                            <Text style={{
                                color: isSelected ? 'white' : colors.text, 
                                fontWeight: (isSelected || hasExpense || hasIncome) ? 'bold' : 'normal'
                            }}>
                                {day}
                            </Text>
                            <View style={{flexDirection:'row', gap: 2, position:'absolute', bottom: 4}}>
                                {hasIncome && <View style={{width:4, height:4, borderRadius:2, backgroundColor:'#10B981'}} />}
                                {hasExpense && <View style={{width:4, height:4, borderRadius:2, backgroundColor:'#EF4444'}} />}
                            </View>
                        </View>
                    )}
                </TouchableOpacity>
            );
        })}
      </View>
    </View>
  );
};

// --- 3. Pie Chart ---
const SimplePieChart = ({ data, strokeColor = 'white' }) => {
  const total = data.reduce((acc, item) => acc + item.y, 0);
  if (total === 0) return <Text style={{ textAlign: 'center', color: '#999', margin: 20 }}>S&apos;ka të dhëna</Text>;

  let startAngle = 0;
  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Svg width={180} height={180} viewBox="0 0 100 100">
        <G transform="rotate(-90, 50, 50)">
          {data.map((slice, index) => {
            const sliceAngle = (slice.y / total) * 360;
            const x1 = 50 + 50 * Math.cos(Math.PI * startAngle / 180);
            const y1 = 50 + 50 * Math.sin(Math.PI * startAngle / 180);
            const x2 = 50 + 50 * Math.cos(Math.PI * (startAngle + sliceAngle) / 180);
            const y2 = 50 + 50 * Math.sin(Math.PI * (startAngle + sliceAngle) / 180);
            const largeArc = sliceAngle > 180 ? 1 : 0;
            const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArc} 1 ${x2} ${y2} Z`;
            startAngle += sliceAngle;
            return <Path key={index} d={pathData} fill={slice.color} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />;
          })}
        </G>
      </Svg>
    </View>
  );
};

// --- 4. Weekly Spending Chart ---
const WeeklySpendingChart = ({ data, textColor, barColor }) => {
  // Shtojmë 20% buffer tek maxVal që shtylla më e lartë të mos prekë tavanin
  const maxVal = Math.max(...data.map(d => d.value), 10) * 1.2;
  const height = 150;
  const width = 300;
  const barWidth = 20;
  const spacing = (width - (data.length * barWidth)) / (data.length + 1);

  return (
    <View style={{ alignItems: 'center', marginVertical: 10 }}>
      <Svg width={width} height={height + 30}>
        {data.map((d, i) => {
          const barHeight = (d.value / maxVal) * height;
          const x = spacing + i * (barWidth + spacing);
          const y = height - barHeight;
          
          return (
            <G key={i}>
              <Rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={barColor}
                rx="4"
              />
              <SvgText
                x={x + barWidth / 2}
                y={height + 20}
                fill={textColor}
                fontSize="12"
                textAnchor="middle"
              >
                {d.label}
              </SvgText>
              {d.value > 0 && (
                <SvgText
                  x={x + barWidth / 2}
                  y={y - 5}
                  fill={textColor}
                  fontSize="10"
                  textAnchor="middle"
                >
                  {formatCurrency(d.value)}
                </SvgText>
              )}
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

export default function ReportsScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { selectedDate, changeMonth: ctxChangeMonth, selectMonth: ctxSelectMonth, selectYear } = useFilter();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

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

  const changeMonth = (increment) => {
    ctxChangeMonth(increment);
    setSelectedDay(null);
  };

  const selectMonth = (monthIndex) => {
    ctxSelectMonth(monthIndex);
    setSelectedDay(null);
    setShowMonthPicker(false);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === selectedDate.getMonth() && d.getFullYear() === selectedDate.getFullYear();
    });
  }, [transactions, selectedDate]);

  // --- Llogaritjet ---

  const chartData = useMemo(() => {
    const expenses = filteredTransactions.filter(t => !DEFAULT_INCOME_CATEGORIES.includes(t.category));
    const byCat = expenses.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {});
    
    const fallbackColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6366F1', '#14B8A6', '#F97316', '#84CC16'];
    const getFallbackColor = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return fallbackColors[Math.abs(hash) % fallbackColors.length];
    };

    return Object.keys(byCat)
      .map((key, i) => ({
        x: key,
        y: byCat[key],
        color: CATEGORY_ICONS[key]?.color || getFallbackColor(key)
      }))
      .sort((a, b) => b.y - a.y);
  }, [filteredTransactions]);

  const selectedDayTransactions = useMemo(() => {
    if (!selectedDay) return [];
    return filteredTransactions.filter(t => {
        const d = new Date(t.date);
        return d.getDate() === selectedDay;
    });
  }, [filteredTransactions, selectedDay]);

  const totalExpense = filteredTransactions
    .filter(t => !DEFAULT_INCOME_CATEGORIES.includes(t.category))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const totalIncome = filteredTransactions
    .filter(t => DEFAULT_INCOME_CATEGORIES.includes(t.category))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const netBalance = totalIncome - totalExpense;

  const dailyAverage = useMemo(() => {
      const currentMonthExpenses = filteredTransactions.filter(t => {
          return !DEFAULT_INCOME_CATEGORIES.includes(t.category);
      });
      const total = currentMonthExpenses.reduce((acc, t) => acc + Number(t.amount), 0);
      
      // If selected month is current month, divide by today's date.
      // If selected month is past, divide by days in month.
      const now = new Date();
      let days = 1;
      if (selectedDate.getMonth() === now.getMonth() && selectedDate.getFullYear() === now.getFullYear()) {
          days = now.getDate();
      } else {
          days = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      }
      
      return days > 0 ? total / days : 0;
  }, [filteredTransactions, selectedDate]);

  // --- New: Weekly Breakdown Data ---
  const weeklyData = useMemo(() => {
    const days = ['Di', 'Hë', 'Ma', 'Më', 'En', 'Pr', 'Sh']; // Sunday to Saturday
    const expenses = filteredTransactions.filter(t => !DEFAULT_INCOME_CATEGORIES.includes(t.category));
    
    const grouped = new Array(7).fill(0);
    
    expenses.forEach(t => {
        const d = new Date(t.date);
        const dayIndex = d.getDay(); // 0 = Sunday, 6 = Saturday
        grouped[dayIndex] += Number(t.amount);
    });

    // Shift so Monday is first if preferred, but standard getDay() is 0=Sun. 
    // Let's keep 0=Sun (Di) as per array above.
    return days.map((label, i) => ({
        label,
        value: grouped[i]
    }));
  }, [filteredTransactions]);

  // --- New: Monthly Comparison ---
  const comparisonData = useMemo(() => {
    const prevDate = new Date(selectedDate);
    prevDate.setMonth(selectedDate.getMonth() - 1);
    
    const prevMonthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === prevDate.getMonth() && d.getFullYear() === prevDate.getFullYear();
    });

    const prevExpense = prevMonthTx
        .filter(t => !DEFAULT_INCOME_CATEGORIES.includes(t.category))
        .reduce((acc, t) => acc + Number(t.amount), 0);

    const diff = totalExpense - prevExpense;
    const percent = prevExpense > 0 ? (diff / prevExpense) * 100 : 0;
    
    return { prevExpense, diff, percent };
  }, [transactions, selectedDate, totalExpense]);

  return (
    <ResponsiveContainer>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20}}>
            <Text style={[styles.headerTitle, { color: colors.text, marginTop: 0, marginBottom: 0 }]}>Pasqyra Financiare</Text>
        </View>

      <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20}}>
          <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 20, padding: 5}}>
              <TouchableOpacity onPress={() => changeMonth(-1)} style={{padding: 5}}>
                  <ChevronLeft size={24} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowMonthPicker(true)}>
                <Text style={{color: colors.text, fontWeight: 'bold', marginHorizontal: 10, minWidth: 80, textAlign: 'center'}}>
                    {selectedDate.toLocaleDateString('sq-AL', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => changeMonth(1)} style={{padding: 5}}>
                  <ChevronRight size={24} color={colors.text} />
              </TouchableOpacity>
          </View>
      </View>

      {/* Month Picker Modal */}
      <Modal visible={showMonthPicker} transparent animationType="fade">
        <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'center', alignItems:'center'}}>
            <View style={{width:'85%', backgroundColor: colors.card, borderRadius: 16, padding: 20}}>
                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 20}}>
                    <Text style={{fontSize: 18, fontWeight:'bold', color: colors.text}}>Zgjidh Muajin</Text>
                    <TouchableOpacity onPress={() => setShowMonthPicker(false)}>
                        <X size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: 20, backgroundColor: colors.background, padding: 10, borderRadius: 12}}>
                    <TouchableOpacity onPress={() => selectYear(-1)}>
                        <ChevronLeft size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={{fontSize: 18, fontWeight:'bold', color: colors.text}}>{selectedDate.getFullYear()}</Text>
                    <TouchableOpacity onPress={() => selectYear(1)}>
                        <ChevronRight size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={{flexDirection:'row', flexWrap:'wrap', justifyContent:'space-between'}}>
                    {Array.from({length: 12}).map((_, i) => {
                        const isSelected = i === selectedDate.getMonth();
                        const monthName = new Date(2024, i, 1).toLocaleDateString('sq-AL', { month: 'short' });
                        return (
                            <TouchableOpacity 
                                key={i} 
                                onPress={() => selectMonth(i)}
                                style={{
                                    width: '30%', 
                                    paddingVertical: 12, 
                                    marginBottom: 10, 
                                    borderRadius: 8, 
                                    backgroundColor: isSelected ? colors.primary : colors.background,
                                    alignItems:'center'
                                }}
                            >
                                <Text style={{color: isSelected ? 'white' : colors.text, fontWeight:'bold', textTransform:'capitalize'}}>
                                    {monthName}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
      </Modal>

      {/* Comparison Card */}
      <View style={[styles.card, { backgroundColor: colors.card, padding: 15, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }]}>
         <View>
             <Text style={{color: colors.textSecondary, fontSize: 12}}>Krahasuar me muajin e kaluar</Text>
             <Text style={{color: colors.text, fontWeight:'bold', fontSize: 16}}>
                 € {comparisonData.diff > 0 ? '-' : '+'}{formatCurrency(Math.abs(comparisonData.diff))} ({Math.abs(comparisonData.percent).toFixed(1)}%)
             </Text>
         </View>
         <View style={{flexDirection:'row', alignItems:'center', gap: 5, backgroundColor: comparisonData.diff > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', padding: 8, borderRadius: 12}}>
             {comparisonData.diff > 0 ? <TrendingUp size={20} color="#EF4444" /> : <TrendingDown size={20} color="#10B981" />}
             <Text style={{color: comparisonData.diff > 0 ? '#EF4444' : '#10B981', fontWeight:'bold'}}>
                 {comparisonData.diff > 0 ? 'Më shumë shpenzime' : 'Më pak shpenzime'}
             </Text>
         </View>
      </View>

      {/* Summary Cards Row */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
          <View style={{flexDirection:'row', alignItems:'center', marginBottom:5}}>
             <ArrowUpCircle size={18} color="#10B981" />
             <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}> Të Ardhura</Text>
          </View>
          <Text style={[styles.summaryValue, { color: '#10B981' }]}>€ {formatCurrency(totalIncome)}</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
          <View style={{flexDirection:'row', alignItems:'center', marginBottom:5}}>
             <ArrowDownCircle size={18} color="#EF4444" />
             <Text style={[styles.summaryLabel, {color: colors.textSecondary}]}> Shpenzime</Text>
          </View>
          <Text style={[styles.summaryValue, { color: '#EF4444' }]}>€ {formatCurrency(totalExpense)}</Text>
        </View>
      </View>

      {/* Net Balance & Daily Average */}
      <View style={styles.summaryRow}>
          <View style={[styles.netCard, { backgroundColor: colors.primary, flex: 1 }]}>
            <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12}}>Bilanci Neto</Text>
            <Text style={{color: 'white', fontSize: 22, fontWeight: 'bold'}}>€ {formatCurrency(netBalance)}</Text>
          </View>
          <View style={[styles.netCard, { backgroundColor: colors.card, flex: 1, borderWidth:1, borderColor: colors.border }]}>
            <View style={{flexDirection:'row', alignItems:'center', gap:5}}>
                <Calendar size={14} color={colors.textSecondary}/>
                <Text style={{color: colors.textSecondary, fontSize: 12}}>Mesatarja Ditore</Text>
            </View>
            <Text style={{color: colors.text, fontSize: 22, fontWeight: 'bold'}}>€ {formatCurrency(dailyAverage)}</Text>
          </View>
      </View>

      {/* Bar Chart Section */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Krahasimi Total</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : <SimpleBarChart income={totalIncome} expense={totalExpense} textColor={colors.text} />}
      </View>

      {/* Calendar View */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Kalendari i Shpenzimeve</Text>
        <CalendarView 
            date={selectedDate} 
            transactions={filteredTransactions} 
            onSelectDay={setSelectedDay} 
            selectedDay={selectedDay}
            colors={colors}
        />
        
        {selectedDay && (
            <View style={{marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 15}}>
                <Text style={{fontWeight:'bold', color: colors.text, marginBottom: 10}}>
                    Transaksionet më {selectedDay} {selectedDate.toLocaleDateString('sq-AL', { month: 'long' })}
                </Text>
                {selectedDayTransactions.length === 0 ? (
                    <Text style={{color: colors.textSecondary}}>S&apos;ka transaksione në këtë datë.</Text>
                ) : (
                    selectedDayTransactions.map(t => (
                        <View key={t.id} style={{flexDirection:'row', justifyContent:'space-between', marginBottom: 8}}>
                            <Text style={{color: colors.text}}>{t.category}</Text>
                            <Text style={{fontWeight:'bold', color: DEFAULT_INCOME_CATEGORIES.includes(t.category) ? '#10B981' : '#EF4444'}}>
                                {DEFAULT_INCOME_CATEGORIES.includes(t.category) ? '+' : '-'}€{formatCurrency(t.amount)}
                            </Text>
                        </View>
                    ))
                )}
            </View>
        )}
      </View>

      {/* Weekly Breakdown Chart */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Shpenzimet sipas Ditëve</Text>
        {loading ? <ActivityIndicator color={colors.primary} /> : 
            <WeeklySpendingChart data={weeklyData} textColor={colors.text} barColor={colors.primary} />
        }
      </View>

      {/* Pie Chart & List Section */}
      <View style={[styles.card, { marginBottom: 50, backgroundColor: colors.card }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Top Kategoritë</Text>
        
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <View>
            <SimplePieChart data={chartData} strokeColor={colors.card} />
            
            <View style={{ marginTop: 10 }}>
                {chartData.map((item, index) => (
                    <TouchableOpacity 
                        key={index} 
                        style={[styles.catRow, { borderBottomColor: colors.border }]}
                        onPress={() => navigation.navigate('AllTransactions', { category: item.x })}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: item.color, marginRight: 10 }} />
                            <Text style={{ fontSize: 14, color: colors.text, fontWeight: '500' }}>{item.x}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 14, fontWeight: 'bold', color: colors.text }}>€ {formatCurrency(item.y)}</Text>
                            <Text style={{ fontSize: 12, color: colors.textSecondary }}>{Math.round((item.y / totalExpense) * 100)}%</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
    </ResponsiveContainer>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 40, marginBottom: 20 },
  
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, gap: 15 },
  summaryCard: { flex: 1, padding: 15, borderRadius: 16, borderWidth: 1, borderBottomWidth: 4 },
  summaryLabel: { fontSize: 12, fontWeight: '600' },
  summaryValue: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },

  netCard: { padding: 15, borderRadius: 16, boxShadow: '0px 2px 4px rgba(0,0,0,0.1)', elevation: 2, justifyContent:'center' },

  card: { borderRadius: 16, padding: 20, marginBottom: 20, boxShadow: '0px 2px 4px rgba(0,0,0,0.05)', elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  
  catRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
});