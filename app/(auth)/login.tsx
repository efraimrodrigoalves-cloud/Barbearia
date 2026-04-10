import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useRouter, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../lib/logger';

export default function Login() {
  const hasLoggedMount = useRef(false);
  if (!hasLoggedMount.current) {
    logger.screen.render('Login');
    hasLoggedMount.current = true;
  }
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function signInWithEmail() {
    setLoading(true);
    logger.info(`Tentativa de login: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      logger.auth.error('login', error);
      Alert.alert('Falha no Login', error.message);
    } else {
      logger.auth.login(email, true);
      logger.info(`Usuário logado: ${data.user?.id}`);
      
      // Verificar role do usuário
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user?.id)
        .single();
      
      logger.info(`Perfil carregado: ${profile?.full_name} | Role: ${profile?.role}`);
      router.replace('/(tabs)');
    }
    setLoading(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#121212] justify-center px-6">
      <View className="items-center mb-10">
        <Ionicons name="cut" size={60} color="#d4af37" />
        <Text className="text-[#d4af37] text-4xl font-bold mt-2 text-center">Barbearia App</Text>
      </View>
      
      <View className="mb-4">
        <Text className="text-gray-400 mb-2 ml-1">E-mail</Text>
        <TextInput
          className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-gray-800"
          placeholder="seu@email.com"
          placeholderTextColor="#666"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      <View className="mb-8">
        <Text className="text-gray-400 mb-2 ml-1">Senha</Text>
        <TextInput
          className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-gray-800"
          placeholder="********"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>

      <TouchableOpacity 
        onPress={signInWithEmail} 
        disabled={loading}
        className="bg-[#d4af37] p-4 rounded-xl items-center mb-6 shadow-lg shadow-black"
      >
        <Text className="text-black font-bold text-lg">{loading ? 'Carregando...' : 'Entrar'}</Text>
      </TouchableOpacity>

      <View className="flex-row justify-center">
        <Text className="text-gray-400">Não tem uma conta? </Text>
        <Link href="/(auth)/register">
          <Text className="text-[#d4af37] font-bold">Cadastre-se</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}
