import React, { useEffect, useState } from 'react';
import { View, Text, Button, StyleSheet, FlatList } from 'react-native';
import { VictoryPie } from 'victory-native';
import { getTransactions } from '../api/transactions';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [aggregated, setAggregated] = useState([]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const tx = await getTransactions(user.id);
        setTransactions(tx);
        const byCat = tx.reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
          return acc;
        }, {});
        setAggregated(Object.entries(byCat).map(([x, y]) => ({ x, y })));
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      {aggregated.length > 0 ? (
        <VictoryPie data={aggregated} x="x" y="y" height={250} innerRadius={30} />
      ) : (
        <Text>No transactions yet</Text>
      )}
      <Button title="Add Transaction" onPress={() => navigation.navigate('AddTransaction')} />
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item.category} — {item.amount}</Text>
            <Text>{new Date(item.date).toLocaleString()}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, marginBottom: 12 },
  item: { paddingVertical: 8, borderBottomWidth: 1, borderColor: '#eee' },
});
