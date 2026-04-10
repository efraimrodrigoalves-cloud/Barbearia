import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useRouter, useFocusEffect } from 'expo-router';
import { logger } from '../../lib/logger';

/**
 * Tela de Perfil do Cliente
 * 
 * Descrição: Exibe resumo do perfil com acesso a carteira, pontos, preferências, galeria, etc.
 * Tabelas utilizadas: profiles, client_wallet, loyalty_points, client_preferences
 * Logs: [PERFIL]
 */
const LOG_PREFIX = '[PERFIL]';

export default function ProfileScreen() {
  const router = useRouter();
  
  // Estados
  const [profile, setProfile] = useState<any>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [loyaltyLevel, setLoyaltyLevel] = useState<any>(null);
  const [nextLevel, setNextLevel] = useState<any>(null);
  const [preferences, setPreferences] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [recurringAppointment, setRecurringAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // =============================================
  // CARREGAR DADOS DO PERFIL
  // =============================================
  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [])
  );

  /**
   * Carrega todos os dados do perfil do cliente
   * Otimizado: busca dados em paralelo para eliminar waterfalls
   */
  const loadProfileData = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      // Buscar TODOS os dados em PARALELO para eliminar waterfalls
      const [profileRes, walletRes, pointsRes, prefsRes, photosRes, recurringRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('client_wallet').select('*').eq('user_id', user.id).single(),
        supabase.from('loyalty_points').select('*').eq('user_id', user.id).single(),
        supabase.from('client_preferences').select('*, barbers(name), services(name)').eq('user_id', user.id).single(),
        supabase.from('client_photos').select('*, barbers(name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('recurring_appointments').select('*, barbers(name), services(name)').eq('user_id', user.id).eq('is_active', true).single(),
      ]);

      if (profileRes.data) setProfile(profileRes.data);
      if (walletRes.data) setWallet(walletRes.data);
      if (prefsRes.data) setPreferences(prefsRes.data);
      if (photosRes.data) setPhotos(photosRes.data);
      if (recurringRes.data) setRecurringAppointment(recurringRes.data);

      if (pointsRes.data) {
        setLoyaltyPoints(pointsRes.data.points);
        
        // Níveis de fidelidade (dado raramente muda, pode cachear)
        const { data: levels } = await supabase
          .from('loyalty_levels')
          .select('*')
          .order('min_points', { ascending: false });

        if (levels) {
          const currentLevel = levels.find(l => pointsRes.data.points >= l.min_points);
          const nextLvl = levels.reverse().find(l => pointsRes.data.points < l.min_points);
          setLoyaltyLevel(currentLevel);
          setNextLevel(nextLvl);
        }
      }

    } catch (e) {
      logger.error('Erro ao carregar dados do perfil', e);
    }
    
    setLoading(false);
  };

  const handleLogout = async () => {
    Alert.alert(
      'Sair da Conta',
      'Deseja realmente sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sair',
          style: 'destructive',
          onPress: async () => {
            try {
              await supabase.auth.signOut();
              await AsyncStorage.clear();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Erro', 'Não foi possível sair. Tente novamente.');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#121212] items-center justify-center">
        <ActivityIndicator size="large" color="#d4af37" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-[#d4af37] text-2xl font-bold mb-6">Meu Perfil</Text>

        {/* ============================================= */}
        {/* CABEÇALHO DO PERFIL */}
        {/* ============================================= */}
        <View className="items-center mb-6">
          <Image 
            source={{ uri: profile?.avatar_url || 'https://i.pravatar.cc/150?img=11' }} 
            className="w-24 h-24 rounded-full border-4 border-[#d4af37] mb-4 bg-gray-700" 
          />
          <Text className="text-white text-xl font-bold">{profile?.full_name || 'Cliente'}</Text>
          <Text className="text-gray-400">{profile?.email || ''}</Text>
          {loyaltyLevel && (
            <View className="flex-row items-center mt-2 px-4 py-1 rounded-full" style={{ backgroundColor: loyaltyLevel.color + '20', borderColor: loyaltyLevel.color, borderWidth: 1 }}>
              <Ionicons name={loyaltyLevel.icon as any} size={16} color={loyaltyLevel.color} />
              <Text className="ml-2 font-bold" style={{ color: loyaltyLevel.color }}>{loyaltyLevel.name}</Text>
            </View>
          )}
        </View>

        {/* ============================================= */}
        {/* CARTEIRA DIGITAL */}
        {/* ============================================= */}
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/wallet' as any)}
          className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-4"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-[#d4af37]/20 items-center justify-center mr-4">
                <Ionicons name="wallet" size={24} color="#d4af37" />
              </View>
              <View>
                <Text className="text-gray-400 text-xs">Saldo da Carteira</Text>
                <Text className="text-white text-2xl font-bold">R$ {(wallet?.balance || 0).toFixed(2)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
        </TouchableOpacity>

        {/* ============================================= */}
        {/* PONTOS DE FIDELIDADE */}
        {/* ============================================= */}
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/loyalty' as any)}
          className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-4"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-purple-900/30 items-center justify-center mr-4">
                <Ionicons name="star" size={24} color="#a855f7" />
              </View>
              <View>
                <Text className="text-gray-400 text-xs">Pontos de Fidelidade</Text>
                <Text className="text-purple-400 text-2xl font-bold">{loyaltyPoints} pts</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
          {nextLevel && (
            <View>
              <Text className="text-gray-500 text-xs mb-1">
                Faltam {nextLevel.min_points - loyaltyPoints} pts para {nextLevel.name}
              </Text>
              <View className="bg-gray-800 rounded-full h-2 overflow-hidden">
                <View 
                  className="h-full rounded-full"
                  style={{ 
                    width: `${(loyaltyPoints / nextLevel.min_points) * 100}%`,
                    backgroundColor: nextLevel.color 
                  }}
                />
              </View>
            </View>
          )}
        </TouchableOpacity>

        {/* ============================================= */}
        {/* PREFERÊNCIAS */}
        {/* ============================================= */}
        <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-bold text-lg">Minhas Preferências</Text>
            <TouchableOpacity onPress={() => router.push('/profile/preferences' as any)}>
              <Text className="text-[#d4af37]">Editar</Text>
            </TouchableOpacity>
          </View>
          
          {preferences ? (
            <View>
              {preferences.preferred_barber_id && (
                <View className="flex-row items-center mb-3">
                  <Ionicons name="person" size={18} color="#d4af37" style={{ marginRight: 10 }} />
                  <Text className="text-gray-300">Barbeiro: {preferences.barbers?.name || 'Configurado'}</Text>
                </View>
              )}
              {preferences.preferred_service_id && (
                <View className="flex-row items-center mb-3">
                  <Ionicons name="cut" size={18} color="#d4af37" style={{ marginRight: 10 }} />
                  <Text className="text-gray-300">Serviço: {preferences.services?.name || 'Configurado'}</Text>
                </View>
              )}
              {preferences.preferred_time && (
                <View className="flex-row items-center mb-3">
                  <Ionicons name="time" size={18} color="#d4af37" style={{ marginRight: 10 }} />
                  <Text className="text-gray-300">Horário: {preferences.preferred_time}</Text>
                </View>
              )}
              {preferences.hair_type && (
                <View className="flex-row items-center">
                  <Ionicons name="body" size={18} color="#d4af37" style={{ marginRight: 10 }} />
                  <Text className="text-gray-300">Cabelo: {preferences.hair_type}</Text>
                </View>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => router.push('/profile/preferences' as any)}
              className="items-center py-4"
            >
              <Ionicons name="add-circle-outline" size={32} color="#666" />
              <Text className="text-gray-500 mt-2">Configurar preferências</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ============================================= */}
        {/* AGENDAMENTO RECORRENTE */}
        {/* ============================================= */}
        <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-4">
          <Text className="text-white font-bold text-lg mb-4">Agendamento Recorrente</Text>
          
          {recurringAppointment ? (
            <View>
              <View className="flex-row items-center mb-3">
                <Ionicons name="refresh" size={18} color="#22c55e" style={{ marginRight: 10 }} />
                <Text className="text-green-400 font-bold">Ativo</Text>
              </View>
              <Text className="text-gray-300 mb-1">
                {recurringAppointment.services?.name} com {recurringAppointment.barbers?.name}
              </Text>
              <Text className="text-gray-400 text-sm">
                A cada {recurringAppointment.frequency_days} dias às {recurringAppointment.preferred_time}
              </Text>
              {recurringAppointment.next_appointment_date && (
                <Text className="text-[#d4af37] mt-2">
                  Próximo: {new Date(recurringAppointment.next_appointment_date).toLocaleDateString('pt-BR')}
                </Text>
              )}
            </View>
          ) : (
            <TouchableOpacity 
              onPress={() => router.push('/profile/recurring' as any)}
              className="items-center py-4"
            >
              <Ionicons name="calendar-outline" size={32} color="#666" />
              <Text className="text-gray-500 mt-2">Configurar agendamento automático</Text>
              <Text className="text-gray-600 text-xs mt-1">Nunca mais esqueça de agendar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ============================================= */}
        {/* GALERIA DE FOTOS */}
        {/* ============================================= */}
        <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white font-bold text-lg">Meus Cortes</Text>
            <TouchableOpacity onPress={() => router.push('/profile/gallery' as any)}>
              <Text className="text-[#d4af37]">Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          {photos.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.map((photo) => (
                <Image
                  key={photo.id}
                  source={{ uri: photo.photo_url }}
                  className="w-20 h-20 rounded-xl mr-3 bg-gray-700"
                />
              ))}
            </ScrollView>
          ) : (
            <View className="items-center py-4">
              <Ionicons name="camera-outline" size={32} color="#666" />
              <Text className="text-gray-500 mt-2">Nenhuma foto ainda</Text>
              <Text className="text-gray-600 text-xs mt-1">Peça para o barbeiro fotografar seu corte</Text>
            </View>
          )}
        </View>

        {/* ============================================= */}
        {/* CATÁLOGO DE ESTILOS */}
        {/* ============================================= */}
        <TouchableOpacity 
          onPress={() => router.push('/profile/catalog' as any)}
          className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-4"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-blue-900/30 items-center justify-center mr-4">
                <Ionicons name="images" size={24} color="#3b82f6" />
              </View>
              <View>
                <Text className="text-white font-bold">Catálogo de Estilos</Text>
                <Text className="text-gray-400 text-sm">Inspire-se com nossos cortes</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
        </TouchableOpacity>

        {/* ============================================= */}
        {/* LEMBRETES */}
        {/* ============================================= */}
        <TouchableOpacity 
          onPress={() => router.push('/profile/reminders' as any)}
          className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-4"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-yellow-900/30 items-center justify-center mr-4">
                <Ionicons name="notifications" size={24} color="#eab308" />
              </View>
              <View>
                <Text className="text-white font-bold">Lembretes</Text>
                <Text className="text-gray-400 text-sm">Configure quando ser lembrado</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#666" />
          </View>
        </TouchableOpacity>

        {/* ============================================= */}
        {/* MENU DE OPÇÕES */}
        {/* ============================================= */}
        <View className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 overflow-hidden">
          <TouchableOpacity 
            onPress={() => router.push('/(tabs)/appointments')}
            className="flex-row items-center p-4 border-b border-gray-800"
          >
            <Ionicons name="calendar-outline" size={22} color="#d4af37" />
            <Text className="text-white font-semibold ml-4">Minha Agenda</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/profile/notifications' as any)}
            className="flex-row items-center p-4 border-b border-gray-800"
          >
            <Ionicons name="notifications-outline" size={22} color="#d4af37" />
            <Text className="text-white font-semibold ml-4">Notificações</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/profile/help' as any)}
            className="flex-row items-center p-4 border-b border-gray-800"
          >
            <Ionicons name="help-circle-outline" size={22} color="#d4af37" />
            <Text className="text-white font-semibold ml-4">Ajuda e Suporte</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push('/profile/about' as any)}
            className="flex-row items-center p-4 border-b border-gray-800"
          >
            <Ionicons name="information-circle-outline" size={22} color="#d4af37" />
            <Text className="text-white font-semibold ml-4">Sobre o App</Text>
            <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* ============================================= */}
        {/* BOTÃO SAIR */}
        {/* ============================================= */}
        <TouchableOpacity 
          onPress={handleLogout}
          className="bg-red-900/30 border border-red-700 p-4 rounded-2xl items-center mb-8"
        >
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={22} color="#f87171" />
            <Text className="text-red-400 font-bold ml-2">Sair da Conta</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}
