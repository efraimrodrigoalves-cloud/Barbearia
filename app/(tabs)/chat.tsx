import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';

export default function ChatScreen() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('client');

  // Estado da conversa
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Lista de conversas (para todos os usuários)
  const [conversations, setConversations] = useState<any[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  // Nova conversa (para cliente)
  const [showNewConversation, setShowNewConversation] = useState(false);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<any>(null);
  const [creatingConversation, setCreatingConversation] = useState(false);

  // Nova conversa (para admin - selecionar cliente)
  const [clientsList, setClientsList] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  // Auto-scroll das mensagens
  const messagesRef = useRef<ScrollView>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
      fetchBarbers();
    }
  }, [currentUser]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUser(user);

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserRole(profile.role || 'client');
      logger.info(`[CHAT] Usuário: ${profile.full_name} | Role: ${profile.role}`);
    }
  };

  const fetchBarbers = async () => {
    const { data } = await supabase
      .from('barbers')
      .select('id, name')
      .order('name', { ascending: true });

    if (data) setBarbers(data);
  };

  const fetchClientsForChat = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'client')
      .order('full_name', { ascending: true });

    if (data) setClientsList(data);
  };

  const fetchConversations = async () => {
    setLoadingConversations(true);

    try {
      if (userRole === 'admin') {
        // Admin vê todas as conversas
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            profiles:client_id(id, full_name),
            barbers(id, name)
          `)
          .order('updated_at', { ascending: false });

        if (error) {
          logger.error('Erro ao buscar conversas', error);
        } else {
          setConversations(data || []);
        }
      } else {
        // Cliente/barbeiro vê apenas suas conversas
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            profiles:client_id(id, full_name),
            barbers(id, name)
          `)
          .eq('client_id', currentUser?.id)
          .order('updated_at', { ascending: false });

        if (error) {
          logger.error('Erro ao buscar conversas', error);
        } else {
          setConversations(data || []);
        }
      }
    } catch (e: any) {
      logger.error('Erro ao buscar conversas', e);
    }
    setLoadingConversations(false);
  };

  const openConversation = async (conversation: any) => {
    setSelectedConversation(conversation);
    await fetchMessages(conversation.id);
  };

  const fetchMessages = async (conversationId: string) => {
    setLoadingMessages(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, profiles:sender_id(full_name)')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) {
        logger.error('Erro ao buscar mensagens', error);
      } else {
        setMessages(data || []);
        // Marcar mensagens como lidas
        await supabase
          .from('messages')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('conversation_id', conversationId)
          .eq('is_read', false)
          .neq('sender_id', currentUser?.id);
      }
    } catch (e: any) {
      logger.error('Erro ao buscar mensagens', e);
    }
    setLoadingMessages(false);
  };

  const createConversation = async () => {
    if (userRole === 'admin') {
      // Admin cria conversa com cliente (barbeiro é opcional)
      if (!selectedClient) {
        Alert.alert('Erro', 'Selecione um cliente');
        return;
      }

      setCreatingConversation(true);

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          client_id: selectedClient.id,
          barber_id: selectedBarber?.id || null,
          status: 'active',
        })
        .select(`
          *,
          profiles:client_id(id, full_name),
          barbers(id, name)
        `)
        .single();

      setCreatingConversation(false);

      if (error) {
        Alert.alert('Erro', 'Não foi possível criar a conversa');
      } else {
        setShowNewConversation(false);
        setSelectedClient(null);
        setSelectedBarber(null);
        setSelectedConversation(data);
        setMessages([]);
        fetchConversations();
      }
    } else {
      // Cliente cria conversa com barbeiro
      if (!selectedBarber) {
        Alert.alert('Erro', 'Selecione um barbeiro');
        return;
      }

      setCreatingConversation(true);

      const { data, error } = await supabase
        .from('conversations')
        .insert({
          client_id: currentUser?.id,
          barber_id: selectedBarber.id,
          status: 'active',
        })
        .select(`
          *,
          profiles:client_id(id, full_name),
          barbers(id, name)
        `)
        .single();

      setCreatingConversation(false);

      if (error) {
        Alert.alert('Erro', 'Não foi possível criar a conversa');
      } else {
        setShowNewConversation(false);
        setSelectedBarber(null);
        setSelectedConversation(data);
        setMessages([]);
        fetchConversations();
      }
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setSendingMessage(true);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          sender_id: currentUser?.id,
          content: newMessage.trim(),
          message_type: 'text',
        })
        .select()
        .single();

      if (error) {
        Alert.alert('Erro', 'Não foi possível enviar a mensagem');
      } else {
        setMessages(prev => [...prev, data]);
        setNewMessage('');

        await supabase
          .from('conversations')
          .update({
            last_message: newMessage.trim(),
            last_message_at: new Date().toISOString(),
            last_sender_id: currentUser?.id,
          })
          .eq('id', selectedConversation.id);
      }
    } catch (e: any) {
      logger.error('Erro ao enviar mensagem', e);
    }
    setSendingMessage(false);
  };

  const closeConversation = () => {
    setSelectedConversation(null);
    setMessages([]);
    setShowNewConversation(false);
    setSelectedBarber(null);
    setSelectedClient(null);
    fetchConversations();
  };

  // =============================================
  // TELA DE MENSAGENS DE UMA CONVERSA
  // =============================================
  if (selectedConversation) {
    return (
      <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
        {/* HEADER */}
        <View className="flex-row items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-gray-800">
          <TouchableOpacity onPress={closeConversation} className="flex-row items-center">
            <Ionicons name="arrow-back" size={24} color="#d4af37" style={{ marginRight: 12 }} />
            <View>
              <Text className="text-white font-bold">
                {userRole === 'admin' ? selectedConversation.profiles?.full_name || 'Cliente' : 'Barbearia'}
              </Text>
              {selectedConversation.barbers && userRole === 'admin' && (
                <Text className="text-gray-400 text-xs">{selectedConversation.barbers.name}</Text>
              )}
              {selectedConversation.barbers && userRole === 'client' && (
                <Text className="text-gray-400 text-xs">Barbeiro: {selectedConversation.barbers.name}</Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 rounded-full bg-gray-800 items-center justify-center">
            <Ionicons name="ellipsis-vertical" size={18} color="#d4af37" />
          </TouchableOpacity>
        </View>

        {/* MENSAGENS */}
        {loadingMessages ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#d4af37" />
          </View>
        ) : (
          <ScrollView
            ref={messagesRef}
            className="flex-1 px-4 pt-4"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => messagesRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View className="items-center justify-center py-20">
                <Ionicons name="chatbubble-ellipses-outline" size={64} color="#333" />
                <Text className="text-gray-500 mt-4 text-lg">Nenhuma mensagem ainda</Text>
                <Text className="text-gray-600 text-sm mt-1">Envie a primeira mensagem!</Text>
              </View>
            ) : (
              messages.map((msg) => {
                const isMine = msg.sender_id === currentUser?.id;
                return (
                  <View key={msg.id} className={`mb-3 ${isMine ? 'items-end' : 'items-start'}`}>
                    {!isMine && (
                      <Text className="text-gray-500 text-xs mb-1 px-1">
                        {msg.profiles?.full_name || 'Admin'}
                      </Text>
                    )}
                    <View className={`max-w-[80%] px-4 py-3 rounded-2xl ${isMine ? 'bg-[#d4af37] rounded-br-sm' : 'bg-[#1e1e1e] border border-gray-700 rounded-bl-sm'}`}>
                      <Text className={isMine ? 'text-black' : 'text-white'}>{msg.content}</Text>
                    </View>
                    <Text className="text-gray-600 text-xs mt-1 px-1">
                      {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* INPUT */}
        <View className="flex-row items-end px-4 py-3 bg-[#1e1e1e] border-t border-gray-800">
          <View className="flex-1 bg-[#121212] rounded-2xl border border-gray-700 px-4 py-3 mr-3">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Digite sua mensagem..."
              placeholderTextColor="#666"
              multiline
              className="text-white max-h-24"
            />
          </View>
          <TouchableOpacity
            onPress={sendMessage}
            disabled={sendingMessage || !newMessage.trim()}
            className={`w-12 h-12 rounded-full items-center justify-center ${newMessage.trim() ? 'bg-[#d4af37]' : 'bg-gray-700'}`}
          >
            {sendingMessage ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Ionicons name="send" size={20} color={newMessage.trim() ? '#000' : '#666'} />
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // =============================================
  // TELA DE NOVA CONVERSA
  // =============================================
  if (showNewConversation) {
    return (
      <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          {/* HEADER */}
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => { setShowNewConversation(false); setSelectedBarber(null); setSelectedClient(null); }} className="flex-row items-center">
              <Ionicons name="arrow-back" size={24} color="#d4af37" style={{ marginRight: 12 }} />
              <Text className="text-white font-bold text-xl">Nova Conversa</Text>
            </TouchableOpacity>
          </View>

          {/* SELEÇÃO DE BARBEIRO */}
          {userRole === 'client' ? (
            <>
              <Text className="text-gray-400 text-sm mb-3">Escolha com quem deseja falar:</Text>
              {barbers.map((barber) => (
                <TouchableOpacity
                  key={barber.id}
                  onPress={() => setSelectedBarber(barber)}
                  className={`flex-row items-center p-4 rounded-2xl mb-3 ${selectedBarber?.id === barber.id ? 'bg-[#d4af37]/20 border border-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                >
                  <View className="w-12 h-12 rounded-full bg-[#d4af37]/20 items-center justify-center mr-4">
                    <Ionicons name="person" size={24} color="#d4af37" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold">{barber.name}</Text>
                    <Text className="text-gray-400 text-sm">Barbeiro</Text>
                  </View>
                  {selectedBarber?.id === barber.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#d4af37" />
                  )}
                </TouchableOpacity>
              ))}

              {/* Opção de falar com o admin */}
              <TouchableOpacity
                onPress={() => setSelectedBarber({ id: null, name: 'Admin' })}
                className={`flex-row items-center p-4 rounded-2xl mb-3 ${selectedBarber?.id === null && selectedBarber?.name === 'Admin' ? 'bg-[#d4af37]/20 border border-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
              >
                <View className="w-12 h-12 rounded-full bg-purple-900/30 items-center justify-center mr-4">
                  <Ionicons name="shield-checkmark" size={24} color="#a855f7" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-bold">Admin da Barbearia</Text>
                  <Text className="text-gray-400 text-sm">Falar com o administrador</Text>
                </View>
                {selectedBarber?.id === null && selectedBarber?.name === 'Admin' && (
                  <Ionicons name="checkmark-circle" size={24} color="#d4af37" />
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* ADMIN: Selecionar cliente */}
              <Text className="text-gray-400 text-sm mb-2">Barbeiro (opcional)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                {barbers.map((b) => (
                  <TouchableOpacity
                    key={b.id}
                    onPress={() => setSelectedBarber(b)}
                    className={`px-4 py-2 rounded-xl mr-2 ${selectedBarber?.id === b.id ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                  >
                    <Text className={`font-bold text-sm ${selectedBarber?.id === b.id ? 'text-black' : 'text-gray-400'}`}>{b.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text className="text-gray-400 text-sm mb-2">Selecionar Cliente</Text>
              {clientsList.length === 0 && (
                <TouchableOpacity onPress={fetchClientsForChat} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 items-center mb-4">
                  <Text className="text-[#d4af37] font-bold">Carregar Clientes</Text>
                </TouchableOpacity>
              )}
              {clientsList.map((client) => (
                <TouchableOpacity
                  key={client.id}
                  onPress={() => setSelectedClient(client)}
                  className={`flex-row items-center p-4 rounded-xl mb-2 ${selectedClient?.id === client.id ? 'bg-[#d4af37]/20 border border-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                >
                  <View className="w-10 h-10 rounded-full bg-gray-700 items-center justify-center mr-3">
                    <Ionicons name="person" size={20} color="#d4af37" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold">{client.full_name}</Text>
                    <Text className="text-gray-400 text-xs">{client.phone || 'Sem telefone'}</Text>
                  </View>
                  {selectedClient?.id === client.id && (
                    <Ionicons name="checkmark-circle" size={24} color="#d4af37" />
                  )}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* Botão Iniciar Conversa */}
          <TouchableOpacity
            onPress={createConversation}
            disabled={creatingConversation || (userRole === 'client' && !selectedBarber) || (userRole === 'admin' && !selectedClient)}
            className={`py-4 rounded-2xl items-center mt-4 mb-10 ${(userRole === 'client' && selectedBarber) || (userRole === 'admin' && selectedClient) ? 'bg-[#d4af37]' : 'bg-gray-700'}`}
          >
            {creatingConversation ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text className={`font-bold text-lg ${((userRole === 'client' && selectedBarber) || (userRole === 'admin' && selectedClient)) ? 'text-black' : 'text-gray-500'}`}>Iniciar Conversa</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // =============================================
  // LISTA DE CONVERSAS
  // =============================================
  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-[#d4af37] text-2xl font-bold">Chat</Text>
            <Text className="text-gray-400 text-sm mt-1">
              {userRole === 'admin' ? 'Gerencie suas conversas' : 'Fale com a barbearia'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowNewConversation(true)}
            className="w-12 h-12 rounded-full bg-[#d4af37] items-center justify-center"
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {loadingConversations ? (
          <View className="items-center py-16">
            <ActivityIndicator size="large" color="#d4af37" />
          </View>
        ) : conversations.length === 0 ? (
          <View className="items-center py-16">
            <View className="w-20 h-20 rounded-full bg-[#1e1e1e] items-center justify-center mb-4">
              <Ionicons name="chatbubbles-outline" size={40} color="#333" />
            </View>
            <Text className="text-gray-400 text-lg font-bold">Nenhuma conversa ainda</Text>
            <Text className="text-gray-500 text-sm mt-1">Toque em + para iniciar uma conversa</Text>
          </View>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              onPress={() => openConversation(conv)}
              className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-3 flex-row items-center"
              activeOpacity={0.7}
            >
              <View className="w-14 h-14 rounded-full bg-[#d4af37]/20 items-center justify-center mr-4">
                <Ionicons name="person" size={28} color="#d4af37" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">
                  {userRole === 'admin' ? conv.profiles?.full_name || 'Cliente' : conv.barbers?.name || 'Barbearia'}
                </Text>
                <Text className="text-gray-400 text-sm mt-1" numberOfLines={1}>
                  {conv.last_message || 'Nenhuma mensagem'}
                </Text>
              </View>
              <View className="items-end">
                {conv.last_message_at && (
                  <Text className="text-gray-500 text-xs">
                    {new Date(conv.last_message_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </Text>
                )}
                <Ionicons name="chevron-forward" size={20} color="#666" style={{ marginTop: 4 }} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
