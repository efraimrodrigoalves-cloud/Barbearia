import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { logger } from '../../lib/logger';

/**
 * Retorna os próximos 7 dias (exceto domingo)
 * Usado para mostrar opções de data ao cliente
 */
const getNextDays = () => {
  const days = [];
  const start = new Date();
  for(let i=0; i<7; i++) {
     const d = new Date(start);
     d.setDate(start.getDate() + i);
     if(d.getDay() !== 0) days.push(d); // Ignora domingo
  }
  return days;
};

/**
 * Retorna lista de horários padrão (09:00 às 18:00)
 * Intervalos de 30 minutos
 */
const getStandardTimes = () => {
   const times = [];
   for(let h=9; h<=18; h++){
      const hr = h.toString().padStart(2, '0');
      times.push(`${hr}:00`);
      if(h !== 18) times.push(`${hr}:30`);
   }
   return times;
};

/**
 * Verifica se um horário está dentro de algum bloqueio
 * @param time - Horário no formato HH:MM
 * @param blocks - Lista de bloqueios do barbeiro
 * @returns true se o horário estiver bloqueado
 */
const isTimeBlocked = (time: string, blocks: any[]): boolean => {
  for (const block of blocks) {
    if (time >= block.start_time && time < block.end_time) {
      return true;
    }
  }
  return false;
};

export default function SelectDateTime() {
   const router = useRouter();
   const params = useLocalSearchParams();
   const barberId = params.barberId as string;
   
   const [days] = useState(getNextDays());
   const [selectedDate, setSelectedDate] = useState<Date>(days[0]);
   const [selectedTime, setSelectedTime] = useState<string | null>(null);
   const [standardTimes] = useState(getStandardTimes());
   
   const [bookedTimes, setBookedTimes] = useState<string[]>([]);
   const [blockedTimes, setBlockedTimes] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);

   /**
    * Busca agendamentos existentes e bloqueios do barbeiro
    * para a data selecionada
    * 
    * Logs: [BOOKING]
    */
   useEffect(() => {
      async function fetchAvailability() {
         if(!selectedDate || !barberId) return;
         setLoading(true);
         setSelectedTime(null);

         const dateStr = selectedDate.toISOString().split('T')[0];
         const dayOfWeek = selectedDate.getDay();
         
         console.log('[BOOKING] Buscando horários para:', { dateStr, barberId });

         // Buscar agendamentos existentes
         const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('appointment_date')
            .eq('barber_id', barberId)
            .gte('appointment_date', `${dateStr}T00:00:00.000Z`)
            .lte('appointment_date', `${dateStr}T23:59:59.999Z`)
            .in('status', ['pending', 'confirmed']);

         if (apptError) {
            console.log('[ERRO] Falha ao buscar agendamentos:', apptError.message);
         }

         // Buscar bloqueios do barbeiro para esta data
         // Inclui bloqueios específicos da data E bloqueios recorrentes para este dia da semana
         const { data: blocks, error: blockError } = await supabase
            .from('schedule_blocks')
            .select('*')
            .eq('barber_id', barberId)
            .or(`block_date.eq.${dateStr},and(is_recurring.eq.true,recurring_day.eq.${dayOfWeek})`);

         if (blockError) {
            console.log('[ERRO] Falha ao buscar bloqueios:', blockError.message);
         }

         // Processar horários agendados
         if (appointments) {
            const booked = appointments.map(appt => {
               const d = new Date(appt.appointment_date);
               const hours = d.getHours().toString().padStart(2,'0');
               const minutes = d.getMinutes().toString().padStart(2,'0');
               return `${hours}:${minutes}`;
            });
            setBookedTimes(booked);
            console.log('[BOOKING] Horários ocupados encontrados:', booked);
         } else {
            setBookedTimes([]);
         }

         // Processar bloqueios
         if (blocks) {
            setBlockedTimes(blocks);
            console.log('[BOOKING] Bloqueios encontrados para', dateStr, ':', blocks.length);
         } else {
            setBlockedTimes([]);
         }
         
         setLoading(false);
      }
      fetchAvailability();
   }, [selectedDate.toISOString().split('T')[0], barberId]);

  /**
   * Navega para a tela de confirmação com os dados selecionados
   */
  const handleNext = () => {
    if (selectedDate && selectedTime) {
      const dayStr = selectedDate.getDate().toString().padStart(2, '0');
      const mesStr = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const friendlyDate = `${dayStr}/${mesStr} às ${selectedTime}`;
      
      const isoDate = new Date(selectedDate);
      const [h, m] = selectedTime.split(':').map(Number);
      isoDate.setHours(h, m, 0, 0);
      
      router.push({ 
        pathname: '/booking/confirm', 
        params: { ...params, dateStr: friendlyDate, isoDate: isoDate.toISOString() } 
      });
    }
  };

  /**
   * Retorna nome abreviado do dia da semana
   */
  const getDayName = (d: Date) => {
     const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
     return `${d.getDate().toString().padStart(2, '0')} ${names[d.getDay()]}`;
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row items-center mb-6">
           <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
             <Ionicons name="arrow-back" size={28} color="#d4af37" />
           </TouchableOpacity>
           <Text className="text-white text-xl font-bold">Escolher a Data</Text>
        </View>
         <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 pl-1">
           {days.map((date, idx) => {
              const isSelected = selectedDate.toDateString() === date.toDateString();
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedDate(date)}
                  className={`p-4 mr-3 rounded-2xl border ${isSelected ? 'border-[#d4af37] bg-[#1e1e1e]' : 'border-gray-800 bg-[#1e1e1e]'}`}
                >
                  <Text className={isSelected ? 'text-[#d4af37] font-bold' : 'text-white'}>{getDayName(date)}</Text>
                </TouchableOpacity>
              )
           })}
         </ScrollView>

        <Text className="text-white text-xl font-bold mb-4">Horários Disponíveis</Text>
        
        {/* Legenda */}
        <View className="flex-row mb-4">
          <View className="flex-row items-center mr-4">
            <View className="w-4 h-4 rounded bg-[#1e1e1e] border border-gray-800 mr-2" />
            <Text className="text-gray-400 text-xs">Disponível</Text>
          </View>
          <View className="flex-row items-center mr-4">
            <View className="w-4 h-4 rounded bg-gray-900 opacity-50 mr-2" />
            <Text className="text-gray-400 text-xs">Ocupado</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded bg-red-900/50 mr-2" />
            <Text className="text-gray-400 text-xs">Bloqueado</Text>
          </View>
        </View>
        
        {loading ? (
           <ActivityIndicator size="large" color="#d4af37" />
        ) : (
         <View className="flex-row flex-wrap justify-between">
           {standardTimes.map((time, idx) => {
              const isBooked = bookedTimes.includes(time);
              const isBlocked = isTimeBlocked(time, blockedTimes);
              
              // Verificar se horário já passou (apenas para hoje)
              const now = new Date();
              const isToday = selectedDate.toDateString() === now.toDateString();
              const [h, m] = time.split(':').map(Number);
              const isPast = isToday && (h < now.getHours() || (h === now.getHours() && m <= now.getMinutes()));
              
              const isUnavailable = isBooked || isBlocked || isPast;
              const isSelected = selectedTime === time;

              // Encontrar motivo do bloqueio (se houver)
              const blockReason = isBlocked ? blockedTimes.find(b => 
                time >= b.start_time && time < b.end_time
              )?.reason : null;
              const timeLabel = isPast ? 'Passado' : blockReason;

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => !isUnavailable && setSelectedTime(time)}
                  disabled={isUnavailable}
                  className={`p-3 mb-4 rounded-xl border w-[30%] items-center 
                     ${isSelected ? 'border-[#d4af37] bg-[#1e1e1e]' 
                     : isBlocked ? 'border-red-900 bg-red-900/30' 
                     : isPast ? 'border-gray-900 bg-gray-900 opacity-30'
                     : isBooked ? 'border-gray-900 bg-gray-900 opacity-50' 
                     : 'border-gray-800 bg-[#1e1e1e]'}`}
                >
                  <Text className={
                     isSelected ? 'text-[#d4af37] font-bold' 
                     : isBlocked ? 'text-red-400 line-through'
                     : isPast ? 'text-gray-700 line-through'
                     : isBooked ? 'text-gray-600 line-through'
                     : 'text-gray-300'
                  }>{time}</Text>
                  {timeLabel && (
                    <Text className="text-red-400/70 text-[10px] mt-1">{timeLabel}</Text>
                  )}
                </TouchableOpacity>
              )
           })}
         </View>
        )}

        {/* Resumo de horários */}
        <View className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mt-4 mb-4">
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className="text-green-400 font-bold">{standardTimes.length - bookedTimes.length - blockedTimes.filter(b => standardTimes.some(t => t >= b.start_time && t < b.end_time)).length}</Text>
              <Text className="text-gray-500 text-xs">Livres</Text>
            </View>
            <View className="items-center">
              <Text className="text-gray-400 font-bold">{bookedTimes.length}</Text>
              <Text className="text-gray-500 text-xs">Ocupados</Text>
            </View>
            <View className="items-center">
              <Text className="text-red-400 font-bold">{blockedTimes.length}</Text>
              <Text className="text-gray-500 text-xs">Bloqueios</Text>
            </View>
          </View>
        </View>
      </ScrollView>
      <View className="p-4 border-t border-gray-800">
        <TouchableOpacity
          onPress={handleNext}
          disabled={!selectedDate || !selectedTime}
          className={`py-4 rounded-xl items-center shadow-lg shadow-black ${selectedDate && selectedTime ? 'bg-[#d4af37]' : 'bg-gray-800'}`}
        >
          <Text className={`font-bold text-lg ${selectedDate && selectedTime ? 'text-black' : 'text-gray-500'}`}>Continuar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
