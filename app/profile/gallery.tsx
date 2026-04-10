import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from '../../lib/supabase';

/**
 * Tela de Galeria de Fotos
 * 
 * Descrição: Histórico visual dos cortes do cliente
 * Tabelas utilizadas: client_photos, appointments
 * Logs: [GALERIA]
 */
const LOG_PREFIX = '[GALERIA]';

export default function GalleryScreen() {
  const router = useRouter();
  
  // Estados
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [retrying, setRetrying] = useState(false);

  // =============================================
  // VERIFICAR CONEXÃO
  // =============================================
  useEffect(() => {
    /**
     * Verifica status da conexão de rede
     * 
     * Logs: [GALERIA]
     */
    const unsubscribe = NetInfo.addEventListener(state => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsOnline(connected ?? false);
      if (connected && photos.length === 0) {
        console.log(`${LOG_PREFIX} Conexão restaurada, recarregando fotos`);
        loadPhotos();
      }
    });

    return () => unsubscribe();
  }, []);

  // =============================================
  // CARREGAR DADOS
  // =============================================
  useEffect(() => {
    loadPhotos();
  }, []);

  /**
   * Carrega fotos do cliente
   * 
   * Verifica conexão antes de tentar buscar do servidor.
   * Se offline, mostra mensagem apropriada.
   * 
   * Logs: [GALERIA]
   */
  const loadPhotos = async () => {
    setLoading(true);
    setRetrying(true);
    console.log(`${LOG_PREFIX} Carregando fotos...`);

    try {
      // Verificar conexão antes de fazer requisição
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected || netInfo.isInternetReachable === false) {
        console.log(`${LOG_PREFIX} Sem conexão, não é possível carregar fotos`);
        setIsOnline(false);
        setLoading(false);
        setRetrying(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log(`${LOG_PREFIX} Usuário não autenticado`);
        setLoading(false);
        setRetrying(false);
        return;
      }

      const { data, error } = await supabase
        .from('client_photos')
        .select('*, barbers(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log(`[ERRO] Falha ao carregar fotos:`, error.message);
        Alert.alert('Erro', 'Não foi possível carregar as fotos. Verifique sua conexão.');
      } else if (data) {
        setPhotos(data);
        setIsOnline(true);
        console.log(`${LOG_PREFIX} Fotos carregadas:`, data.length);
      }
    } catch (e: any) {
      console.log(`[ERRO] Erro ao carregar galeria:`, e.message);
      setIsOnline(false);
    }
    
    setLoading(false);
    setRetrying(false);
  };

  /**
   * Agrupa fotos por mês
   */
  const groupedPhotos = photos.reduce((groups: any, photo) => {
    const date = new Date(photo.created_at);
    const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    
    if (!groups[key]) {
      groups[key] = { label, photos: [] };
    }
    groups[key].photos.push(photo);
    return groups;
  }, {});

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
          <Text className="text-white text-xl font-bold">Meus Cortes</Text>
        </View>

        <Text className="text-gray-400 mb-6">
          Seu histórico visual de cortes e transformações
        </Text>

        {/* Estatísticas */}
        <View className="flex-row mb-6">
          <View className="flex-1 bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mr-2 items-center">
            <Text className="text-[#d4af37] text-2xl font-bold">{photos.length}</Text>
            <Text className="text-gray-400 text-xs">Fotos</Text>
          </View>
          <View className="flex-1 bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 ml-2 items-center">
            <Text className="text-[#d4af37] text-2xl font-bold">
              {photos.filter(p => p.photo_type === 'before').length}
            </Text>
            <Text className="text-gray-400 text-xs">Antes/Depois</Text>
          </View>
        </View>

        {/* Galeria */}
        {!isOnline ? (
          <View className="items-center py-16">
            <View className="bg-[#1e1e1e] p-8 rounded-full mb-6">
              <Ionicons name="cloud-offline-outline" size={64} color="#666" />
            </View>
            <Text className="text-gray-300 text-xl font-bold">Sem Conexão</Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              Não foi possível carregar as fotos. Verifique sua conexão.
            </Text>
            <TouchableOpacity
              onPress={loadPhotos}
              disabled={retrying}
              className="bg-[#d4af37] px-6 py-3 rounded-xl mt-6"
            >
              <Text className="text-black font-bold">{retrying ? 'Tentando...' : 'Tentar Novamente'}</Text>
            </TouchableOpacity>
          </View>
        ) : photos.length === 0 ? (
          <View className="items-center py-16">
            <View className="bg-[#1e1e1e] p-8 rounded-full mb-6">
              <Ionicons name="camera-outline" size={64} color="#333" />
            </View>
            <Text className="text-gray-300 text-xl font-bold">Nenhuma foto ainda</Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              Peça para o barbeiro fotografar seu corte na próxima visita!
            </Text>
          </View>
        ) : (
          Object.entries(groupedPhotos).map(([key, group]: [string, any]) => (
            <View key={key} className="mb-6">
              <Text className="text-white font-bold mb-3 capitalize">{group.label}</Text>
              <View className="flex-row flex-wrap justify-between">
                {group.photos.map((photo: any) => (
                  <TouchableOpacity
                    key={photo.id}
                    onPress={() => setSelectedPhoto(photo)}
                    className="mb-3"
                    style={{ width: '31%' }}
                  >
                    <Image
                      source={{ uri: photo.photo_url }}
                      className="w-full h-28 rounded-xl bg-gray-800"
                    />
                    {photo.photo_type === 'before' && (
                      <View className="absolute top-2 left-2 bg-blue-600 px-2 py-0.5 rounded-full">
                        <Text className="text-white text-xs">Antes</Text>
                      </View>
                    )}
                    {photo.photo_type === 'after' && (
                      <View className="absolute top-2 left-2 bg-green-600 px-2 py-0.5 rounded-full">
                        <Text className="text-white text-xs">Depois</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Modal de Foto Selecionada */}
        {selectedPhoto && (
          <View className="absolute inset-0 bg-black/90 items-center justify-center p-4">
            <TouchableOpacity 
              onPress={() => setSelectedPhoto(null)}
              className="absolute top-12 right-4 p-2"
            >
              <Ionicons name="close" size={32} color="#fff" />
            </TouchableOpacity>
            
            <Image
              source={{ uri: selectedPhoto.photo_url }}
              className="w-full h-96 rounded-2xl"
              resizeMode="contain"
            />
            
            <View className="mt-4 items-center">
              <Text className="text-white font-bold">{selectedPhoto.description || 'Meu corte'}</Text>
              {selectedPhoto.barbers && (
                <Text className="text-gray-400 mt-1">com {selectedPhoto.barbers.name}</Text>
              )}
              <Text className="text-gray-500 text-xs mt-2">
                {new Date(selectedPhoto.created_at).toLocaleDateString('pt-BR')}
              </Text>
            </View>
          </View>
        )}

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
