import * as ImagePicker from 'expo-image-picker';
import { Camera, LogOut, Save } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import supabaseClient from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    birthdate: '',
  });

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseClient
        .from('profiles')
        .select('first_name, last_name, gender, birthdate, avatar_url')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
      }

      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          gender: data.gender || '',
          birthdate: data.birthdate || '',
        });
        if (data.avatar_url) setAvatarUrl(data.avatar_url);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0]);
      }
    } catch (e) {
      Alert.alert('Gabim', 'Nuk mund të hapet galeria.');
    }
  };

  const uploadImage = async (imageAsset) => {
    try {
      setUploading(true);
      const fileExt = imageAsset.uri.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const response = await fetch(imageAsset.uri);
      const arrayBuffer = await response.arrayBuffer();

      const { error: uploadError } = await supabaseClient.storage
        .from('avatars')
        .upload(filePath, arrayBuffer, {
          contentType: imageAsset.mimeType || 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabaseClient.storage.from('avatars').getPublicUrl(filePath);
      
      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ avatar_url: data.publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      setAvatarUrl(data.publicUrl);
      Alert.alert('Sukses', 'Foto e profilit u përditësua!');
    } catch (error) {
      console.error(error);
      Alert.alert('Gabim', 'Dështoi ngarkimi i fotos. Sigurohuni që keni krijuar bucket "avatars" në Supabase.');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Gabim', 'Ju lutem plotësoni fushat e fjalëkalimit.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Gabim', 'Fjalëkalimet nuk përputhen.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Gabim', 'Fjalëkalimi duhet të jetë të paktën 6 karaktere.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabaseClient.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert('Sukses', 'Fjalëkalimi u ndryshua me sukses!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      Alert.alert('Gabim', error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const { error } = await supabaseClient
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          gender: formData.gender,
          birthdate: formData.birthdate,
          updated_at: new Date(),
        })
        .eq('id', user.id);

      if (error) throw error;
      Alert.alert('Sukses', 'Profili u përditësua me sukses!');
    } catch (e) {
      console.error(e);
      Alert.alert('Gabim', 'Nuk mund të përditësohej profili.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{flex:1}}>
      <ScrollView style={styles.container}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 40, marginBottom: 20 }}>
          <Text style={styles.headerTitle}>Profili</Text>
          <TouchableOpacity onPress={signOut} style={{ padding: 8, backgroundColor: '#E5E7EB', borderRadius: 20 }}>
              <LogOut size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {uploading ? (
              <View style={styles.avatarPlaceholder}>
                 <ActivityIndicator color="#2563EB" />
              </View>
            ) : avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={{fontSize: 30}}>👤</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Camera size={14} color="white" />
            </View>
          </TouchableOpacity>
          
          <Text style={styles.name}>{formData.first_name ? `${formData.first_name} ${formData.last_name}` : (user?.email?.split('@')[0] || 'Përdorues')}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Të dhënat personale</Text>
          
          {loading ? <ActivityIndicator color="#2563EB" /> : (
            <>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Emri</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.first_name}
                  onChangeText={t => setFormData({...formData, first_name: t})}
                  placeholder="Emri juaj"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mbiemri</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.last_name}
                  onChangeText={t => setFormData({...formData, last_name: t})}
                  placeholder="Mbiemri juaj"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Gjinia</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.gender}
                  onChangeText={t => setFormData({...formData, gender: t})}
                  placeholder="M / F"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Ditëlindja</Text>
                <TextInput 
                  style={styles.input} 
                  value={formData.birthdate}
                  onChangeText={t => setFormData({...formData, birthdate: t})}
                  placeholder="YYYY-MM-DD"
                />
              </View>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="white" /> : (
                  <>
                    <Save size={20} color="white" />
                    <Text style={styles.saveBtnText}>Ruaj Ndryshimet</Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Ndrysho Fjalëkalimin</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fjalëkalimi i ri</Text>
            <TextInput 
              style={styles.input} 
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Shkruani fjalëkalimin e ri"
              secureTextEntry
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Konfirmo Fjalëkalimin</Text>
            <TextInput 
              style={styles.input} 
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Konfirmoni fjalëkalimin"
              secureTextEntry
            />
          </View>
          <TouchableOpacity style={[styles.saveBtn, {backgroundColor: '#4B5563'}]} onPress={handlePasswordChange} disabled={saving}>
             <Text style={styles.saveBtnText}>Përditëso Fjalëkalimin</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={signOut}>
          <LogOut size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Dil nga llogaria</Text>
        </TouchableOpacity>
        
        <View style={{height: 50}} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  profileCard: { backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 24, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatarImage: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#2563EB', padding: 6, borderRadius: 15, borderWidth: 2, borderColor: 'white' },

  name: { fontSize: 20, fontWeight: 'bold', color: '#1F2937' },
  email: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  
  formSection: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, color: '#374151' },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#4B5563', marginBottom: 5, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 16, color: '#1F2937' },
  
  saveBtn: { backgroundColor: '#2563EB', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 10 },
  saveBtnText: { color: 'white', fontWeight: 'bold', marginLeft: 8, fontSize: 16 },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF2F2', padding: 16, borderRadius: 16, marginBottom: 20 },
  logoutText: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#EF4444' }
});
