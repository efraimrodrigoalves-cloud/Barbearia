import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { sendPushNotification } from '../../lib/notifications';
import { logger } from '../../lib/logger';
import * as Haptics from 'expo-haptics';

/**
 * Tela de Confirmação de Agendamento
 * Exibe resumo e confirma o agendamento
 */
const LOG_PREFIX = '[BOOKING]';

export default function ConfirmBooking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [service, setService] = useState<any>(null);
  const [barber, setBarber] = useState<any>(null);

  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  useEffect(() => {
    async function loadObj() {
      // Buscar dados em paralelo
      const { data: { user } } = await supabase.auth.getUser();
      
      const [serviceRes, barberRes, profileRes] = await Promise.all([
        params.serviceId ? supabase.from('services').select('*').eq('id', params.serviceId).single() : Promise.resolve({ data: null }),
        params.barberId ? supabase.from('barbers').select('*').eq('id', params.barberId).single() : Promise.resolve({ data: null }),
        user ? supabase.from('profiles').select('full_name, phone').eq('id', user.id).single() : Promise.resolve({ data: null }),
      ]);

      if (serviceRes.data) setService(serviceRes.data);
      if (barberRes.data) setBarber(barberRes.data);
      if (profileRes.data) {
        setClientName(profileRes.data.full_name || '');
        setClientPhone(profileRes.data.phone || '');
      }
    }
    loadObj();
  }, [params]);

  const handleConfirm = async () => {
    if (submitting) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        Alert.alert("Erro", "Sessão expirada. Faça login novamente.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      if (!clientName.trim()) {
        Alert.alert("Atenção", "O nome do cliente é obrigatório.");
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Verificar se é mensalista antes de agendar
      const { data: subscription } = await supabase
        .from('monthly_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (subscription) {
        const remaining = subscription.total_cuts - subscription.used_cuts;
        if (remaining <= 0) {
          Alert.alert(
            'Cortes Esgotados',
            'Sua assinatura mensal não possui mais cortes disponíveis. Entre em contato para renovar.',
            [{ text: 'OK', onPress: () => router.back() }]
          );
          setLoading(false);
          setSubmitting(false);
          return;
        }
      }

      // Se é mensalista, criar agendamento diretamente (pagamento já coberto)
      if (subscription) {
        await createAppointmentDirectly(user.id, subscription);
        return;
      }

      // Caso contrário, redirecionar para tela de pagamento
      console.log(`${LOG_PREFIX} Redirecionando para pagamento`);
      setLoading(false);
      setSubmitting(false);

      router.push({
        pathname: '/booking/payment' as any,
        params: {
          serviceId: params.serviceId,
          barberId: params.barberId,
          dateStr: params.dateStr,
          isoDate: params.isoDate,
          clientName: clientName.trim(),
          clientPhone: clientPhone.trim(),
          amount: service?.price || 0
        }
      });

    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível completar o agendamento. Tente novamente.');
      setLoading(false);
      setSubmitting(false);
    }
  };

  const createAppointmentDirectly = async (userId: string, subscription?: any) => {
    try {
      // Criar agendamento
      const { data: appointment, error } = await supabase.from('appointments').insert({
        user_id: userId,
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        barber_id: params.barberId,
        service_id: params.serviceId,
        appointment_date: params.isoDate as string,
        status: 'confirmed',
        payment_method: 'subscription',
        payment_status: 'paid'
      }).select().single();

      if (error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        if (error.message.includes('appointments_barber_datetime_unique') || error.message.includes('duplicate key')) {
          Alert.alert('Horário Ocupado', 'Este horário acabou de ser reservado. Por favor, selecione outro horário.');
          router.back();
        } else {
          Alert.alert('Erro ao agendar', error.message);
        }
        setLoading(false);
        setSubmitting(false);
        return;
      }

      // Dar baixa no mensalista
      if (subscription) {
        await processSubscriptionUsage(subscription, userId);
      }

      setLoading(false);
      setSubmitting(false);
      
      // Mensagem de sucesso personalizada
      const successMsg = subscription 
        ? `Agendamento confirmado! Você tem ${subscription.total_cuts - subscription.used_cuts - 1} cortes restantes na sua assinatura.`
        : 'Agendamento realizado com sucesso!';
      
      router.replace({ 
        pathname: '/booking/success' as any, 
        params: { 
          dateStr: params.dateStr, 
          clientName, 
          subscriptionMsg: successMsg,
          appointmentId: appointment.id,
          barberId: params.barberId,
          barberName: barber?.name || 'Barbeiro',
          serviceName: service?.name || 'Serviço'
        } 
      });

      sendPushNotifications(userId, clientName.trim(), subscription);

    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível completar o agendamento. Tente novamente.');
      setLoading(false);
      setSubmitting(false);
    }
  };

  const processSubscriptionUsage = async (subscription: any, userId: string) => {
    try {
      // Atualizar used_cuts na assinatura
      const { error: updateError } = await supabase
        .from('monthly_subscriptions')
        .update({ 
          used_cuts: subscription.used_cuts + 1,
          status: (subscription.used_cuts + 1 >= subscription.total_cuts) ? 'expired' : 'active'
        })
        .eq('id', subscription.id);

      if (updateError) {
        console.error('Erro ao atualizar assinatura:', updateError);
        return;
      }

      // Registrar no histórico de uso
      await supabase
        .from('subscription_usage')
        .insert({
          subscription_id: subscription.id,
          service_name: service?.name || 'Serviço',
          barber_name: barber?.name || 'Barbeiro',
          used_at: new Date().toISOString()
        });

      console.log('[MENSALISTA] Baixa realizada com sucesso');
    } catch (e) {
      console.error('Erro ao processar baixa do mensalista:', e);
    }
  };

  const sendPushNotifications = async (userId: string, name: string, subscription?: any) => {
    try {
      const { data: prof } = await supabase.from('profiles').select('expo_push_token').eq('id', userId).single();
      if (prof?.expo_push_token) {
        let message = `Show! Você agendou ${service?.name} para o dia ${params.dateStr}. Te esperamos!`;
        if (subscription) {
          const remaining = subscription.total_cuts - subscription.used_cuts - 1;
          message += ` Você tem ${remaining} cortes restantes na assinatura.`;
        }
        await sendPushNotification(prof.expo_push_token, "Corte Confirmado! ✂️", message);
      }
      const { data: admins } = await supabase.from('profiles').select('expo_push_token').eq('role', 'barber').not('expo_push_token', 'is', null);
      if (admins) {
        admins.forEach(async (admin) => {
          if (admin.expo_push_token) {
            let adminMsg = `${name} acabou de agendar ${service?.name} para ${params.dateStr}.`;
            if (subscription) {
              adminMsg += ` (Mensalista - ${subscription.total_cuts - subscription.used_cuts - 1} cortes restantes)`;
            }
            await sendPushNotification(admin.expo_push_token, "Agendamento Efetuado! 💰", adminMsg);
          }
        });
      }
    } catch (e) {
      console.log("Erro silencioso ao enviar push:", e);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <ScrollView className="flex-1 px-4 pt-4">
          <View className="flex-row items-center mb-2">
             <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
               <Ionicons name="arrow-back" size={28} color="#d4af37" />
             </TouchableOpacity>
             <Text className="text-white text-xl font-bold">Confirmação</Text>
          </View>
          <View className="items-center mb-6 mt-2">
             <Ionicons name="checkmark-circle" size={60} color="#d4af37" />
             <Text className="text-white text-2xl font-bold mt-2">Quase lá!</Text>
             <Text className="text-gray-400 text-center mt-1">Revise os detalhes antes de confirmar.</Text>
          </View>

          {(!service || !barber) ? (
              <ActivityIndicator size="large" color="#d4af37" />
          ) : (
          <>
            <View className="bg-[#1e1e1e] p-5 rounded-3xl border border-gray-800 mb-6 shadow-lg shadow-black">
               <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-800">
                 <Text className="text-gray-400">Serviço</Text>
                 <Text className="text-white font-bold">{service.name}</Text>
               </View>
               <View className="flex-row justify-between mb-4 pb-4 border-b border-gray-800">
                 <Text className="text-gray-400">Profissional</Text>
                 <Text className="text-white font-bold">{barber.name.split(' ')[0]}</Text>
               </View>
               <View className="flex-row justify-between">
                 <Text className="text-gray-400">Data e Hora</Text>
                 <Text className="text-[#d4af37] font-bold">{params.dateStr}</Text>
               </View>
            </View>

            <Text className="text-white font-bold mb-3 ml-1">Para quem é o agendamento?</Text>
            <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-8">
               <Text className="text-gray-400 text-xs mb-1">Nome do Cliente</Text>
               <TextInput 
                  value={clientName} 
                  onChangeText={setClientName} 
                  className="text-white font-bold text-lg"
                  placeholderTextColor="#666"
                  placeholder="Nome completo"
               />
               <View className="h-[1px] bg-gray-800 my-2" />
               <Text className="text-gray-400 text-xs mb-1">Telefone (Opcional)</Text>
               <TextInput 
                  value={clientPhone} 
                  onChangeText={setClientPhone} 
                  keyboardType="phone-pad"
                  className="text-white font-bold text-lg"
                  placeholderTextColor="#666"
                  placeholder="(11) 99999-9999"
               />
            </View>
          </>
          )}
        </ScrollView>
        <View className="p-4 border-t border-gray-800">
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading || submitting || !service || !barber}
            className={`py-4 rounded-xl items-center shadow-lg shadow-black ${(!loading && !submitting && service && barber) ? 'bg-[#d4af37]' : 'bg-gray-800'}`}
          >
            <Text className={`font-bold text-lg ${(!loading && !submitting && service && barber) ? 'text-black' : 'text-gray-500'}`}>
              {loading ? 'Salvando...' : 'Confirmar Agendamento'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
