import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PieChart, User, Wallet } from 'lucide-react-native';
import { ActivityIndicator, Platform, View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Import Screens
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import AllTransactionsScreen from './src/screens/AllTransactionsScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReportsScreen from './src/screens/ReportsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 1. Kjo është menyja poshtë (Home, Reports, Profile)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#2563EB', // Ngjyra Blu kur është aktiv
        tabBarInactiveTintColor: '#9CA3AF', // Ngjyra Gri kur s'është aktiv
        tabBarStyle: { 
          paddingBottom: 10, 
          paddingTop: 10, 
          height: 70,
          marginBottom: Platform.OS === 'android' ? 20 : 0, // Ngre menynë pak lart në Android
        },
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Kreu') return <Wallet color={color} size={size} />;
          if (route.name === 'Raporte') return <PieChart color={color} size={size} />;
          if (route.name === 'Profili') return <User color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Kreu" component={HomeScreen} />
      <Tab.Screen name="Raporte" component={ReportsScreen} />
      <Tab.Screen name="Profili" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// 2. Ky është menaxheri i navigimit (Login vs Tabs)
function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          // Nëse s'ka user -> Shko te Login
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          // Nëse ka user -> Shko te Tabs (që ka Home brenda) dhe lejo AddTransaction mbi to
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
            <Stack.Screen name="AllTransactions" component={AllTransactionsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}