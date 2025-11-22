import { LogOut, Settings, Shield, User } from 'lucide-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Profili</Text>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
             <Text style={{fontSize: 30}}>👤</Text>
        </View>
        <Text style={styles.name}>{user?.email?.split('@')[0] || 'Përdorues'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.menuItem}>
            <User size={20} color="#4B5563" />
            <Text style={styles.menuText}>Të dhënat personale</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
            <Settings size={20} color="#4B5563" />
            <Text style={styles.menuText}>Cilësimet</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
            <Shield size={20} color="#4B5563" />
            <Text style={styles.menuText}>Siguria</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
        <LogOut size={20} color="#EF4444" />
        <Text style={styles.logoutText}>Dil nga llogaria</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1F2937', marginBottom: 20, marginTop: 40 },
  profileCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  name: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  email: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  section: { backgroundColor: 'white', borderRadius: 16, padding: 8, marginBottom: 24 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  menuText: { flex: 1, marginLeft: 16, fontSize: 16, color: '#374151' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16 },
  logoutText: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#EF4444' }
});