import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

/**
 * Tela de Preferências do Cliente
 * Permite configurar preferências de atendimento
 */
const LOG_PREFIX = '[PREFERÊNCIAS]';

export default function PreferencesScreen() {
  const router = useRouter();
  
  // Estados
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [preferredBarber, setPreferredBarber] = useState<any>(null);
  const [preferredService, setPreferredService] = useState<any>(null);
  const [preferredTime, setPreferredTime] = useState('');
  const [preferredDay, setPreferredDay] = useState<number | null>(null);
  const [hairType, setHairType] = useState('');
  const [beardStyle, setBeardStyle] = useState('');
  const [notes, setNotes] = useState('');

  const timeSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const hairTypes = ['Liso', 'Ondulado', 'Cacheado', 'Crespo', 'Misto'];
  const beardStyles = ['Nenhuma', 'Cavanhaque', 'Barba Curta', 'Barba Média', 'Barba Longa', 'Desenhada'];

  // =============================================
  // CARREGAR DADOS
  // =============================================
  useEffect(() => {
    loadData();
  }, []);

  /**
   * Carrega barbeiros, serviços e preferências salvas (otimizado com Promise.all)
   */
  const loadData = async () => {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Buscar tudo em paralelo
      const [barbersRes, servicesRes, prefsRes] = await Promise.all([
        supabase.from('barbers').select('*').order('name', { ascending: true }),
        supabase.from('services').select('*').order('name', { ascending: true }),
        supabase.from('client_preferences').select('*').eq('user_id', user.id).single(),
      ]);

      if (barbersRes.data) setBarbers(barbersRes.data);
      if (servicesRes.data) setServices(servicesRes.data);
      
      if (prefsRes.data) {
        setPreferredBarber({ id: prefsRes.data.preferred_barber_id });
        setPreferredService({ id: prefsRes.data.preferred_service_id });
        setPreferredTime(prefsRes.data.preferred_time || '');
        setPreferredDay(prefsRes.data.preferred_day);
        setHairType(prefsRes.data.hair_type || '');
        setBeardStyle(prefsRes.data.beard_style || '');
        setNotes(prefsRes.data.notes || '');
      }
    } catch (e) {
      logger.error('Erro ao carregar preferências', e);
    }
    
    setLoading(false);
  };

  /**
   * Salva as preferências do cliente
   */
  const savePreferences = async () => {
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const prefsData = {
        user_id: user.id,
        preferred_barber_id: preferredBarber?.id || null,
        preferred_service_id: preferredService?.id || null,
        preferred_time: preferredTime || null,
        preferred_day: preferredDay,
        hair_type: hairType || null,
        beard_style: beardStyle || null,
        notes: notes || null,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('client_preferences')
        .upsert(prefsData, { onConflict: 'user_id' });

      if (error) {
        logger.error('Erro ao salvar preferências', error);
        Alert.alert('Erro', 'Não foi possível salvar as preferências');
      } else {
        Alert.alert('Sucesso', 'Preferências salvas com sucesso!');
        router.back();
      }
    } catch (e) {
      logger.error('Erro ao salvar preferências', e);
    }
    
    setSaving(false);
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
        {/* Header */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={28} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Minhas Preferências</Text>
        </View>

        <Text className="text-gray-400 mb-6">
          Configure suas preferências para um atendimento mais rápido e personalizado
        </Text>

        {/* Barbeiro Preferido */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs mb-2">Barbeiro Preferido</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setPreferredBarber(null)}
              className={`px-4 py-3 rounded-xl mr-2 ${!preferredBarber ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
            >
              <Text className={`text-sm ${!preferredBarber ? 'text-black font-bold' : 'text-gray-400'}`}>Qualquer um</Text>
            </TouchableOpacity>
            {barbers.map((b) => (
              <TouchableOpacity
                key={b.id}
                onPress={() => setPreferredBarber(b)}
                className={`px-4 py-3 rounded-xl mr-2 ${preferredBarber?.id === b.id ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${preferredBarber?.id === b.id ? 'text-black font-bold' : 'text-gray-400'}`}>
                  {b.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Serviço Preferido */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs mb-2">Serviço Preferido</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setPreferredService(null)}
              className={`px-4 py-3 rounded-xl mr-2 ${!preferredService ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
            >
              <Text className={`text-sm ${!preferredService ? 'text-black font-bold' : 'text-gray-400'}`}>Nenhum</Text>
            </TouchableOpacity>
            {services.map((s) => (
              <TouchableOpacity
                key={s.id}
                onPress={() => setPreferredService(s)}
                className={`px-4 py-3 rounded-xl mr-2 ${preferredService?.id === s.id ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${preferredService?.id === s.id ? 'text-black font-bold' : 'text-gray-400'}`}>
                  {s.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Horário Preferido */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs mb-2">Horário Preferido</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setPreferredTime('')}
              className={`px-4 py-3 rounded-xl mr-2 ${!preferredTime ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
            >
              <Text className={`text-sm ${!preferredTime ? 'text-black font-bold' : 'text-gray-400'}`}>Qualquer</Text>
            </TouchableOpacity>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                onPress={() => setPreferredTime(time)}
                className={`px-4 py-3 rounded-xl mr-2 ${preferredTime === time ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${preferredTime === time ? 'text-black font-bold' : 'text-gray-400'}`}>{time}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Dia da Semana Preferido */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs mb-2">Dia da Semana Preferido</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setPreferredDay(null)}
              className={`px-4 py-3 rounded-xl mr-2 ${preferredDay === null ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
            >
              <Text className={`text-sm ${preferredDay === null ? 'text-black font-bold' : 'text-gray-400'}`}>Qualquer</Text>
            </TouchableOpacity>
            {dayNames.map((day, idx) => (
              <TouchableOpacity
                key={day}
                onPress={() => setPreferredDay(idx)}
                className={`px-4 py-3 rounded-xl mr-2 ${preferredDay === idx ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${preferredDay === idx ? 'text-black font-bold' : 'text-gray-400'}`}>{day}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Tipo de Cabelo */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs mb-2">Tipo de Cabelo</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => setHairType('')}
              className={`px-4 py-3 rounded-xl mr-2 ${!hairType ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
            >
              <Text className={`text-sm ${!hairType ? 'text-black font-bold' : 'text-gray-400'}`}>Não sei</Text>
            </TouchableOpacity>
            {hairTypes.map((type) => (
              <TouchableOpacity
                key={type}
                onPress={() => setHairType(type)}
                className={`px-4 py-3 rounded-xl mr-2 ${hairType === type ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${hairType === type ? 'text-black font-bold' : 'text-gray-400'}`}>{type}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Estilo de Barba */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs mb-2">Estilo de Barba</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {beardStyles.map((style) => (
              <TouchableOpacity
                key={style}
                onPress={() => setBeardStyle(style)}
                className={`px-4 py-3 rounded-xl mr-2 ${beardStyle === style ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}
              >
                <Text className={`text-sm ${beardStyle === style ? 'text-black font-bold' : 'text-gray-400'}`}>{style}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Observações */}
        <View className="mb-6">
          <Text className="text-gray-400 text-xs mb-2">Observações</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex: Prefiro tesoura, não gosto de máquina muito baixa..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
            className="bg-[#1e1e1e] text-white p-4 rounded-xl border border-gray-700"
            style={{ textAlignVertical: 'top', minHeight: 80 }}
          />
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          onPress={savePreferences}
          disabled={saving}
          className={`py-4 rounded-xl items-center mb-8 ${saving ? 'bg-gray-700' : 'bg-[#d4af37]'}`}
        >
          {saving ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text className="text-black font-bold text-lg">Salvar Preferências</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
