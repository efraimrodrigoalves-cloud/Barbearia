import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import React from 'react';

/**
 * Tela Inicial do Cliente
 * Exibe saudação, banner de agendamento, lista de serviços e profissionais
 */
const LOG_PREFIX = '[HOME]';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia,';
  if (h < 18) return 'Boa tarde,';
  return 'Boa noite,';
}

/**
 * Card de Serviço na tela inicial
 * Layout semelhante ao card de profissional
 */
const ServiceButton = React.memo(({ service, onPress }: { service: any; onPress: () => void }) => (
  <TouchableOpacity
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
    activeOpacity={0.85}
    className="items-center mr-4 bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800"
    style={{ width: 110, minHeight: 44 }}
    accessibilityRole="button"
    accessibilityLabel={`Agendar ${service.name} por R$ ${service.price.toFixed(2)}`}
  >
    <View className="w-14 h-14 rounded-full bg-[#121212] border-2 border-[#d4af37] items-center justify-center mb-3">
      <Ionicons name={service.icon || 'cut'} size={26} color="#d4af37" />
    </View>
    <Text className="text-white font-semibold text-sm text-center mb-1" numberOfLines={2}>{service.name}</Text>
    <Text className="text-[#d4af37] text-sm font-bold">R$ {service.price.toFixed(2)}</Text>
    {service.duration_minutes && (
      <Text className="text-gray-500 text-xs mt-1">{service.duration_minutes} min</Text>
    )}
  </TouchableOpacity>
));

ServiceButton.displayName = 'ServiceButton';

/**
 * Card do Barbeiro na tela inicial
 * Mostra foto, nome, especialidade e avaliação
 */
const BarberCard = React.memo(({ item, rating, onPress }: { item: any; rating: any; onPress: () => void }) => (
  <TouchableOpacity
    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
    activeOpacity={0.85}
    className="items-center mr-5 bg-[#1e1e1e] p-3 rounded-2xl border border-gray-800"
    style={{ width: 120, minHeight: 44 }}
    accessibilityRole="button"
    accessibilityLabel={`Ver perfil de ${item.name}`}
  >
    <Image
      source={{ uri: item.avatar_url || 'https://i.pravatar.cc/150' }}
      className="w-16 h-16 rounded-full border-2 border-[#d4af37] mb-2 bg-gray-800"
    />
    <Text className="text-white font-semibold text-sm text-center" numberOfLines={1}>{item.name.split(' ')[0]}</Text>
    <Text className="text-gray-500 text-xs mb-2" numberOfLines={1}>{item.specialty || 'Barbeiro'}</Text>
    
    {/* Avaliação */}
    {rating && rating.count > 0 ? (
      <View className="flex-row items-center">
        <Ionicons name="star" size={12} color="#d4af37" />
        <Text className="text-[#d4af37] text-xs font-bold ml-1">{rating.avg.toFixed(1)}</Text>
        <Text className="text-gray-500 text-xs ml-1">({rating.count})</Text>
      </View>
    ) : (
      <Text className="text-gray-600 text-xs">Sem avaliações</Text>
    )}
  </TouchableOpacity>
));

BarberCard.displayName = 'BarberCard';

export default function HomeScreen() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [barberRatings, setBarberRatings] = useState<Record<string, { avg: number; count: number }>>({});
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      
      async function loadAll() {
        if (!isMounted) return;
        
        try {
          setError(null);
          
          const { data: { user } } = await supabase.auth.getUser();
          if (user && isMounted) {
            const { data: prof } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
            if (isMounted) setProfile(prof);
          }
          
          // Buscar serviços, barbeiros e avaliações em paralelo
          const [svcsRes, bbsRes, reviewsRes] = await Promise.all([
            supabase.from('services').select('*').order('price', { ascending: true }),
            supabase.from('barbers').select('*').limit(10),
            supabase.from('reviews').select('barber_id, rating'),
          ]);
          
          if (isMounted) {
            if (svcsRes.data) setServices(svcsRes.data);
            if (bbsRes.data) setBarbers(bbsRes.data);
            
            // Calcular avaliações por barbeiro
            if (reviewsRes.data) {
              const ratings: Record<string, { total: number; count: number }> = {};
              reviewsRes.data.forEach(r => {
                if (!ratings[r.barber_id]) ratings[r.barber_id] = { total: 0, count: 0 };
                ratings[r.barber_id].total += r.rating;
                ratings[r.barber_id].count++;
              });

              const avgs: Record<string, { avg: number; count: number }> = {};
              Object.entries(ratings).forEach(([id, val]) => {
                avgs[id] = { avg: val.total / val.count, count: val.count };
              });
              setBarberRatings(avgs);
            }
          }
        } catch (error: any) {
          if (isMounted) setError('Erro ao carregar dados. Verifique sua conexão.');
        } finally {
          if (isMounted) setLoading(false);
        }
      }
      
      loadAll();
      
      return () => { isMounted = false; };
    }, [])
  );

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-4 pb-8">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-8">
            <View>
              <Text className="text-gray-400 text-lg">{getGreeting()}</Text>
              <Text className="text-[#d4af37] text-2xl font-bold">
                {profile?.full_name?.split(' ')[0] || '...'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Ionicons name="person-circle" size={48} color="#d4af37" />
            </TouchableOpacity>
          </View>

          {/* Error State */}
          {error && (
            <TouchableOpacity
              onPress={() => { setLoading(true); setError(null); }}
              className="bg-red-900/20 border border-red-900 p-4 rounded-2xl mb-6 flex-row items-center"
            >
              <Ionicons name="warning" size={20} color="#f87171" style={{ marginRight: 8 }} />
              <Text className="text-red-400 flex-1">{error}</Text>
              <Text className="text-red-400 font-bold">Tentar novamente</Text>
            </TouchableOpacity>
          )}

          {/* Banner */}
          <TouchableOpacity
            onPress={() => router.push('/booking')}
            activeOpacity={0.88}
            className="bg-[#1e1e1e] rounded-3xl p-6 mb-8 border border-[#d4af37] shadow-lg shadow-black flex-row items-center justify-between"
          >
            <View className="flex-1">
              <Text className="text-white text-xl font-bold mb-2">Seu próximo corte</Text>
              <Text className="text-gray-400 mb-4">Agende agora e garanta seu horário.</Text>
              <View className="bg-[#d4af37] py-2 px-4 rounded-full self-start">
                <Text className="text-black font-bold">Agendar Agora</Text>
              </View>
            </View>
            <Ionicons name="calendar" size={60} color="#d4af37" style={{ opacity: 0.8 }} />
          </TouchableOpacity>

          {/* Serviços Header */}
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-white text-xl font-bold">Serviços</Text>
            <TouchableOpacity onPress={() => router.push('/booking')}>
              <Text className="text-[#d4af37] font-semibold">Ver Todos</Text>
            </TouchableOpacity>
          </View>

          {/* Services Scroll Horizontal */}
          {loading ? (
            <ActivityIndicator color="#d4af37" className="mb-8" />
          ) : services.length === 0 ? (
            <View className="items-center py-8 mb-8">
              <Ionicons name="cut-outline" size={40} color="#555" />
              <Text className="text-gray-500 mt-2">Nenhum serviço cadastrado</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              className="mb-8"
            >
              {services.map((service) => (
                <ServiceButton
                  key={service.id}
                  service={service}
                  onPress={() => router.push({ pathname: '/booking/barber', params: { serviceId: service.id } })}
                />
              ))}
            </ScrollView>
          )}

          {/* Barbeiros Header */}
          <View className="flex-row justify-between items-end mb-4">
            <Text className="text-white text-xl font-bold">Profissionais</Text>
          </View>

          {/* Barbers Scroll Horizontal */}
          {loading ? (
            <ActivityIndicator color="#d4af37" className="mb-8" />
          ) : barbers.length === 0 ? (
            <View className="items-center py-8 mb-8">
              <Ionicons name="people-outline" size={40} color="#555" />
              <Text className="text-gray-500 mt-2">Nenhum profissional cadastrado</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
              className="mb-8"
            >
              {barbers.map((barber) => (
                <BarberCard
                  key={barber.id}
                  item={barber}
                  rating={barberRatings[barber.id]}
                  onPress={() => router.push({ 
                    pathname: '/barber/profile', 
                    params: { id: barber.id, name: barber.name } 
                  })}
                />
              ))}
            </ScrollView>
          )}

          {/* Link para ver todos os profissionais */}
          <TouchableOpacity 
            onPress={() => router.push('/booking/barber' as any)}
            className="flex-row items-center justify-center py-3 mb-4"
          >
            <Text className="text-[#d4af37] font-semibold">Ver todos os profissionais</Text>
            <Ionicons name="chevron-forward" size={16} color="#d4af37" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
