import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PieChart, User, Wallet } from 'lucide-react-native';
import { ActivityIndicator, Platform, View } from 'react-native';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { FilterProvider } from './src/contexts/FilterContext';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

// Import Screens
import AddGoalScreen from './src/screens/AddGoalScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import AllTransactionsScreen from './src/screens/AllTransactionsScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import ChatAddScreen from './src/screens/ChatAddScreen';
import HomeScreen from './src/screens/HomeScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import ReportsScreen from './src/screens/ReportsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 1. Menyja poshtë (Home, Reports, Profile)
function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary, 
        tabBarInactiveTintColor: colors.textSecondary, 
        tabBarStyle: { 
          paddingBottom: 10, 
          paddingTop: 10, 
          height: 70,
          marginBottom: Platform.OS === 'android' ? 25 : 0, 
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          // Web/Desktop Optimization
          maxWidth: Platform.OS === 'web' ? 800 : '100%',
          alignSelf: 'center',
          width: '100%',
          left: Platform.OS === 'web' ? '50%' : 0,
          transform: Platform.OS === 'web' ? [{ translateX: '-50%' }] : [],
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

// 2. Menaxheri i navigimit
function AppNavigator() {
  const { user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {!user ? (
          <Stack.Screen name="Login" component={LoginScreen} />
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabs} />
            <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
            <Stack.Screen name="AllTransactions" component={AllTransactionsScreen} />
            <Stack.Screen name="Budget" component={BudgetScreen} />
            <Stack.Screen name="ChatAdd" component={ChatAddScreen} />
            <Stack.Screen name="AddGoal" component={AddGoalScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FilterProvider>
          <AppNavigator />
        </FilterProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}