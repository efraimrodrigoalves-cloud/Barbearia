import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from 'expo-router';
import { logger } from '../../lib/logger';

/**
 * Tela de Agenda do Cliente
 * Mostra agendamentos futuros e passados com opção de avaliar
 */
const LOG_PREFIX = '[AGENDA]';

export default function AppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pastAppointments, setPastAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'proximos' | 'passados'>('proximos');
  const [reviewedAppointments, setReviewedAppointments] = useState<string[]>([]);

  const fetchAppointments = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const now = new Date();
        
        // Buscar dados em paralelo
        const [futureRes, allRes, reviewsRes] = await Promise.all([
          supabase
            .from('appointments')
            .select('id, appointment_date, status, user_id, barber_id, services (name, price), barbers (id, name)')
            .eq('user_id', user.id)
            .gte('appointment_date', now.toISOString())
            .order('appointment_date', { ascending: true }),
            
          supabase
            .from('appointments')
            .select('id, appointment_date, status, user_id, barber_id, services (name, price), barbers (id, name)')
            .eq('user_id', user.id)
            .order('appointment_date', { ascending: false })
            .limit(50),
            
          supabase
            .from('reviews')
            .select('appointment_id')
            .eq('user_id', user.id),
        ]);

        if (futureRes.data) setAppointments(futureRes.data);
        
        if (allRes.data) {
          const pastOrCompleted = allRes.data.filter(a => {
            const apptDate = new Date(a.appointment_date);
            const isPast = apptDate < now;
            const isCompleted = a.status === 'completed';
            const isCancelled = a.status === 'cancelled';
            return isPast || isCompleted || isCancelled;
          });
          setPastAppointments(pastOrCompleted);
        }

        if (reviewsRes.data) {
          setReviewedAppointments(reviewsRes.data.map(r => r.appointment_id));
        }
      }
    } catch (e) {
      logger.error('Erro ao buscar agendamentos', e);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-400', label: 'Confirmado', icon: 'checkmark-circle' };
      case 'cancelled':
        return { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400', label: 'Cancelado', icon: 'close-circle' };
      case 'completed':
        return { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-400', label: 'Concluído', icon: 'checkmark-done-circle' };
      default:
        return { bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-400', label: 'Pendente', icon: 'time' };
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return {
      day,
      dayName: dayNames[d.getDay()],
      month: monthNames[d.getMonth()],
      year,
      time: `${hours}:${minutes}`,
      full: `${day}/${month}/${year}`
    };
  };

  /**
   * Renderiza estrelas de avaliação
   */
  const renderStars = (count: number = 5) => {
    return Array.from({ length: count }, (_, i) => (
      <Ionicons key={i} name="star" size={14} color="#d4af37" />
    ));
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        <Text className="text-[#d4af37] text-2xl font-bold mb-2">Sua Agenda</Text>
        <Text className="text-gray-400 mb-6">Acompanhe seus agendamentos</Text>

        {/* Sub-tabs */}
        <View className="flex-row mb-6">
          <TouchableOpacity 
            onPress={() => setView('proximos')}
            className={`flex-1 py-3 rounded-l-xl items-center ${view === 'proximos' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
          >
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={16} color={view === 'proximos' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
              <Text className={`font-bold text-sm ${view === 'proximos' ? 'text-black' : 'text-gray-400'}`}>Próximos</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setView('passados')}
            className={`flex-1 py-3 rounded-r-xl items-center ${view === 'passados' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
          >
            <View className="flex-row items-center">
              <Ionicons name="time" size={16} color={view === 'passados' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
              <Text className={`font-bold text-sm ${view === 'passados' ? 'text-black' : 'text-gray-400'}`}>Histórico</Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
        ) : view === 'proximos' ? (
          // Agendamentos Futuros
          appointments.length === 0 ? (
            <View className="items-center py-16">
              <View className="bg-[#1e1e1e] p-8 rounded-full mb-6">
                <Ionicons name="calendar-outline" size={64} color="#333" />
              </View>
              <Text className="text-gray-300 text-xl font-bold">Nenhum agendamento</Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                Você ainda não possui agendamentos. Que tal agendar um horário agora?
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/booking')}
                className="bg-[#d4af37] px-8 py-4 rounded-2xl mt-8 flex-row items-center"
              >
                <Ionicons name="calendar" size={20} color="#000" style={{ marginRight: 8 }} />
                <Text className="text-black font-bold text-lg">Agendar Agora</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {appointments.map((appt) => {
                const statusInfo = getStatusInfo(appt.status);
                const dateInfo = formatDate(appt.appointment_date);

                return (
                  <View key={appt.id} className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 overflow-hidden">
                    <View className="flex-row">
                      <View className="bg-[#d4af37] p-4 items-center justify-center" style={{ width: 80 }}>
                        <Text className="text-black font-bold text-2xl">{dateInfo.day}</Text>
                        <Text className="text-black text-xs font-semibold">{dateInfo.dayName}</Text>
                        <Text className="text-black/70 text-xs">{dateInfo.month}</Text>
                      </View>
                      <View className="flex-1 p-4">
                        <View className="flex-row justify-between items-start mb-2">
                          <View className="flex-1 mr-2">
                            <Text className="text-white font-bold text-lg">{appt.services?.name || 'Serviço'}</Text>
                            <Text className="text-gray-400">com {appt.barbers?.name?.split(' ')[0] || 'Barbeiro'}</Text>
                          </View>
                          <View className={`px-3 py-1.5 rounded-full ${statusInfo.bg} border ${statusInfo.border} flex-row items-center`}>
                            <Ionicons name={statusInfo.icon as any} size={12} color="#22c55e" style={{ marginRight: 4 }} />
                            <Text className={`text-xs font-bold ${statusInfo.text}`}>{statusInfo.label}</Text>
                          </View>
                        </View>
                        <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-800">
                          <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={16} color="#d4af37" style={{ marginRight: 6 }} />
                            <Text className="text-[#d4af37] font-bold">{dateInfo.time}</Text>
                          </View>
                          {appt.services?.price && (
                            <Text className="text-gray-400">R$ {appt.services.price.toFixed(2)}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )
        ) : (
          // Agendamentos Passados (Histórico)
          pastAppointments.length === 0 ? (
            <View className="items-center py-16">
              <View className="bg-[#1e1e1e] p-8 rounded-full mb-6">
                <Ionicons name="time-outline" size={64} color="#333" />
              </View>
              <Text className="text-gray-300 text-xl font-bold">Nenhum histórico</Text>
              <Text className="text-gray-500 text-center mt-2 px-8">
                Seus atendimentos anteriores aparecerão aqui.
              </Text>
            </View>
          ) : (
            <>
              {pastAppointments.map((appt) => {
                const dateInfo = formatDate(appt.appointment_date);
                const hasReviewed = reviewedAppointments.includes(appt.id);

                return (
                  <View key={appt.id} className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 overflow-hidden">
                    <View className="flex-row">
                      <View className="bg-gray-700 p-4 items-center justify-center" style={{ width: 80 }}>
                        <Text className="text-white font-bold text-2xl">{dateInfo.day}</Text>
                        <Text className="text-gray-400 text-xs font-semibold">{dateInfo.dayName}</Text>
                        <Text className="text-gray-500 text-xs">{dateInfo.month}</Text>
                      </View>
                      <View className="flex-1 p-4">
                        <View className="flex-row justify-between items-start mb-2">
                          <View className="flex-1 mr-2">
                            <Text className="text-white font-bold">{appt.services?.name || 'Serviço'}</Text>
                            <Text className="text-gray-400 text-sm">com {appt.barbers?.name?.split(' ')[0] || 'Barbeiro'}</Text>
                          </View>
                          {appt.services?.price && (
                            <Text className="text-gray-400">R$ {appt.services.price.toFixed(2)}</Text>
                          )}
                        </View>
                        <View className="flex-row items-center justify-between mt-2">
                          <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={14} color="#666" style={{ marginRight: 4 }} />
                            <Text className="text-gray-500 text-sm">{dateInfo.time}</Text>
                          </View>
                          
                          {/* Status e Botão de Avaliar */}
                          <View className="flex-row items-center">
                            {/* Status Badge */}
                            <View className={`px-2 py-1 rounded-full mr-2 ${
                              appt.status === 'completed' ? 'bg-green-900/30 border border-green-700' :
                              appt.status === 'cancelled' ? 'bg-red-900/30 border border-red-700' :
                              'bg-gray-800 border border-gray-700'
                            }`}>
                              <Text className={`text-xs font-bold ${
                                appt.status === 'completed' ? 'text-green-400' :
                                appt.status === 'cancelled' ? 'text-red-400' :
                                'text-gray-400'
                              }`}>
                                {appt.status === 'completed' ? 'Concluído' :
                                 appt.status === 'cancelled' ? 'Cancelado' :
                                 appt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                              </Text>
                            </View>

                            {/* Botão Avaliar - APENAS se concluído e não avaliado */}
                            {!hasReviewed && appt.barber_id && appt.status === 'completed' ? (
                              <TouchableOpacity 
                                onPress={() => router.push({
                                  pathname: '/booking/review',
                                  params: {
                                    appointmentId: appt.id,
                                    barberId: appt.barber_id,
                                    barberName: appt.barbers?.name || 'Barbeiro',
                                    serviceName: appt.services?.name || 'Serviço'
                                  }
                                })}
                                className="flex-row items-center bg-[#d4af37]/20 px-3 py-1.5 rounded-full"
                              >
                                <Ionicons name="star" size={14} color="#d4af37" style={{ marginRight: 4 }} />
                                <Text className="text-[#d4af37] text-xs font-bold">Avaliar</Text>
                              </TouchableOpacity>
                            ) : hasReviewed ? (
                              <View className="flex-row items-center">
                                <Ionicons name="star" size={14} color="#d4af37" />
                                <Text className="text-green-400 text-xs ml-1">Avaliado</Text>
                              </View>
                            ) : null}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )
        )}

        {/* Botão Novo Agendamento */}
        <TouchableOpacity
          onPress={() => router.push('/booking')}
          className="bg-[#1e1e1e] border border-[#d4af37] p-4 rounded-2xl mt-4 mb-8 flex-row items-center justify-center"
        >
          <Ionicons name="add-circle-outline" size={24} color="#d4af37" style={{ marginRight: 8 }} />
          <Text className="text-[#d4af37] font-bold text-lg">Novo Agendamento</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
