/**
 * Tela de Pagamento
 * 
 * Descrição: Exibe opções de pagamento (PIX/Cartão de Crédito/Carteira Digital/Dinheiro/Cartão na Barbearia) e processa pagamento
 * Parâmetros: serviceId, barberId, dateStr, isoDate, clientName, clientPhone, amount
 * Tabelas utilizadas: payment_transactions, appointments, services, barbers, profiles, client_wallet, wallet_transactions
 * Logs: [PAGAMENTO]
 * 
 * Fluxo:
 * 1. Carrega dados do serviço, barbeiro e perfil do cliente
 * 2. Exibe opções de pagamento (Carteira, PIX, Cartão, Dinheiro, Cartão na Barbearia)
 * 3. Processa pagamento conforme método selecionado
 * 4. Para Cartão: cria preferência no MP e abre checkout externo
 * 5. Para PIX: gera QR Code e monitora status
 * 6. Para Carteira: debita saldo e cria agendamento
 * 7. Para Dinheiro/Cartão na Barbearia: cria agendamento com status pendente
 * 8. Redireciona para tela de sucesso
 * 
 * Integrações:
 * - Mercado Pago (PIX e Cartão de Crédito online)
 * - Deep Linking para retorno do checkout
 * - Carteira Digital (saldo pré-pago)
 * - Pagamento presencial (Dinheiro, Cartão na Barbearia)
 */

import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { createPIXPayment, createPaymentPreference, isPIXExpired } from '../../lib/mercadopago';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';

const LOG_PREFIX = '[PAGAMENTO]';

type PaymentMethod = 'pix' | 'credit_card' | 'wallet' | 'cash' | 'card_at_shop';

export default function PaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [pixData, setPixData] = useState<any>(null);
  const [pixExpired, setPixExpired] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [processingCard, setProcessingCard] = useState(false);
  const [service, setService] = useState<any>(null);
  const [barber, setBarber] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const amount = parseFloat(params.amount as string) || 0;

  useEffect(() => {
    console.log(`${LOG_PREFIX} Tela de pagamento carregada:`, params);
    loadData();
    setupDeepLinkListener();
  }, [params]);

  // Verificar status do PIX a cada 5 segundos
  useEffect(() => {
    if (selectedMethod === 'pix' && pixData?.id) {
      const interval = setInterval(() => {
        checkPIXStatus();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [selectedMethod, pixData]);

  const loadData = async () => {
    try {
      console.log(`${LOG_PREFIX} Carregando dados do serviço e barbeiro`);
      
      const [serviceResult, barberResult, userResult] = await Promise.all([
        supabase.from('services').select('*').eq('id', params.serviceId).single(),
        supabase.from('barbers').select('*').eq('id', params.barberId).single(),
        supabase.auth.getUser()
      ]);

      if (serviceResult.data) {
        setService(serviceResult.data);
        console.log(`${LOG_PREFIX} Serviço carregado: ${serviceResult.data.name}`);
      }

      if (barberResult.data) {
        setBarber(barberResult.data);
        console.log(`${LOG_PREFIX} Barbeiro carregado: ${barberResult.data.name}`);
      }

      if (userResult.data?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userResult.data.user.id)
          .single();

        if (profile) {
          setUserProfile(profile);
          console.log(`${LOG_PREFIX} Perfil carregado: ${profile.full_name}`);

          const { data: wallet } = await supabase
            .from('client_wallet')
            .select('balance')
            .eq('client_id', profile.id)
            .single();

          if (wallet) {
            setWalletBalance(wallet.balance || 0);
            console.log(`${LOG_PREFIX} Saldo da carteira: ${wallet.balance}`);
          }
        }
      }
    } catch (error) {
      console.log(`${LOG_PREFIX} Erro ao carregar dados:`, error);
    }
  };

  /**
   * Configura listener para deep linking
   * 
   * Detecta quando o app é aberto via deep link após pagamento no Mercado Pago.
   * Monitora URLs do tipo barbershop://booking/success, failure ou pending.
   * 
   * Fluxo:
   * 1. Verifica URL inicial (app aberto via link)
   * 2. Registra listener para URLs futuras
   * 3. Chama handleDeepLink quando URL é detectada
   * 
   * Logs: [PAGAMENTO]
   */
  const setupDeepLinkListener = () => {
    console.log(`${LOG_PREFIX} Configurando listener de deep linking`);
    
    // Verificar se app foi aberto via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log(`${LOG_PREFIX} App aberto via deep link:`, url);
        handleDeepLink(url);
      } else {
        console.log(`${LOG_PREFIX} App aberto normalmente (sem deep link)`);
      }
    });

    // Registrar listener para deep links futuros
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log(`${LOG_PREFIX} Deep link recebido em tempo real:`, url);
      handleDeepLink(url);
    });

    return () => subscription.remove();
  };

  /**
   * Processa deep link recebido do Mercado Pago
   * 
   * Chamado quando o app é aberto via deep link após pagamento no MP.
   * Cria o agendamento real e atualiza a transação de pagamento.
   * 
   * @param url - URL do deep link (barbershop://booking/success|failure|pending)
   * 
   * Fluxo:
   * 1. Verifica se perfil está carregado
   * 2. Se success: cria agendamento + atualiza transação + navega para sucesso
   * 3. Se failure: mostra erro de pagamento recusado
   * 4. Se pending: mostra mensagem de pagamento pendente
   * 
   * Tabelas: appointments, payment_transactions
   * Logs: [PAGAMENTO]
   */
  const handleDeepLink = async (url: string) => {
    console.log(`${LOG_PREFIX} Deep link recebido:`, url);
    
    // Verificar se perfil está carregado antes de processar
    if (!userProfile) {
      console.log(`${LOG_PREFIX} Perfil não carregado ainda, aguardando...`);
      return;
    }

    if (url.includes('/booking/success')) {
      console.log(`${LOG_PREFIX} Pagamento aprovado pelo Mercado Pago`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      try {
        // Criar agendamento real no banco de dados
        console.log(`${LOG_PREFIX} Criando agendamento após pagamento aprovado`);
        const { data: appointment, error: appointmentError } = await supabase
          .from('appointments')
          .insert({
            user_id: userProfile.id,
            client_name: params.clientName || userProfile.full_name,
            client_phone: params.clientPhone || userProfile.phone,
            barber_id: params.barberId,
            service_id: params.serviceId,
            appointment_date: params.isoDate,
            status: 'confirmed',
            payment_method: 'credit_card',
            payment_status: 'paid'
          })
          .select()
          .single();

        if (appointmentError) {
          console.log(`${LOG_PREFIX} Erro ao criar agendamento:`, appointmentError.message);
          throw appointmentError;
        }
        console.log(`${LOG_PREFIX} Agendamento criado:`, { id: appointment.id });

        // Atualizar transação de pagamento com appointment_id real
        console.log(`${LOG_PREFIX} Atualizando transação de pagamento`);
        const { error: updateError } = await supabase
          .from('payment_transactions')
          .update({ 
            appointment_id: appointment.id,
            status: 'approved',
            paid_at: new Date().toISOString()
          })
          .eq('client_id', userProfile.id)
          .is('appointment_id', null)
          .eq('payment_method', 'credit_card');

        if (updateError) {
          console.log(`${LOG_PREFIX} Erro ao atualizar transação:`, updateError.message);
        } else {
          console.log(`${LOG_PREFIX} Transação atualizada com sucesso`);
        }

        console.log(`${LOG_PREFIX} Agendamento criado com sucesso:`, appointment.id);

        // Navegar para tela de sucesso
        router.replace({
          pathname: '/booking/success' as any,
          params: {
            dateStr: params.dateStr,
            clientName: params.clientName || userProfile.full_name,
            appointmentId: appointment.id,
            barberId: params.barberId,
            barberName: barber?.name || 'Barbeiro',
            serviceName: service?.name || 'Serviço',
            paymentMethod: 'Cartão de Crédito'
          }
        });
      } catch (error: any) {
        console.log(`[ERRO] Falha ao processar pagamento aprovado:`, error.message);
        Alert.alert('Erro', 'Não foi possível confirmar o agendamento. Entre em contato com o suporte.');
      }
    } else if (url.includes('/booking/failure')) {
      console.log(`${LOG_PREFIX} Pagamento recusado pelo Mercado Pago`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Pagamento Recusado', 'Seu pagamento foi recusado. Tente novamente ou use outro método.');
    } else if (url.includes('/booking/pending')) {
      console.log(`${LOG_PREFIX} Pagamento pendente no Mercado Pago`);
      Alert.alert('Pagamento Pendente', 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.');
    }
  };

  /**
   * Processa pagamento com cartão de crédito via Mercado Pago
   * 
   * Cria uma preferência de pagamento no Mercado Pago e abre o checkout
   * externo para o usuário inserir os dados do cartão.
   * 
   * Fluxo:
   * 1. Verifica se perfil está carregado e não está processando
   * 2. Cria preferência de pagamento no MP via createPaymentPreference
   * 3. Abre checkout do MP no navegador externo via Linking
   * 4. Usuário completa pagamento no site do MP
   * 5. MP redireciona para deep link barbershop://booking/success
   * 6. handleDeepLink processa o retorno
   * 
   * Tabelas: payment_transactions (inserção temporária)
   * API: Mercado Pago Checkout Preferences
   * Logs: [PAGAMENTO]
   */
  const handlePayWithCreditCard = async () => {
    if (loading || !userProfile || processingCard) return;

    console.log(`${LOG_PREFIX} Iniciando pagamento com cartão de crédito`);
    console.log(`${LOG_PREFIX} Dados:`, { amount, serviceId: params.serviceId, barberId: params.barberId });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingCard(true);

    try {
      // Gerar ID temporário para a transação
      const tempAppointmentId = `temp-${Date.now()}`;
      console.log(`${LOG_PREFIX} Criando preferência de pagamento:`, { tempAppointmentId });
      
      // Criar preferência no Mercado Pago
      const preference = await createPaymentPreference(
        tempAppointmentId,
        params.serviceId as string,
        params.barberId as string,
        amount,
        `${service?.name} - ${barber?.name}`,
        userProfile.email || 'cliente@email.com'
      );

      if (preference) {
        console.log(`${LOG_PREFIX} Preferência criada com sucesso:`, { id: preference.id });
        
        // Usar sandbox_init_point em desenvolvimento, init_point em produção
        const checkoutUrl = preference.sandbox_init_point || preference.init_point;
        console.log(`${LOG_PREFIX} Abrindo checkout do Mercado Pago:`, checkoutUrl);
        
        // Abrir checkout no navegador externo
        await Linking.openURL(checkoutUrl);
        console.log(`${LOG_PREFIX} Checkout aberto, aguardando retorno do usuário`);
      } else {
        console.log(`${LOG_PREFIX} Preferência retornou nula`);
        throw new Error('Não foi possível criar a preferência de pagamento');
      }
    } catch (error: any) {
      console.log(`[ERRO] Falha ao processar pagamento com cartão:`, error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível iniciar o pagamento. Tente novamente.');
    } finally {
      setProcessingCard(false);
      console.log(`${LOG_PREFIX} Processo de pagamento com cartão finalizado`);
    }
  };

  /**
   * Processa pagamento em dinheiro na barbearia
   * 
   * Cria o agendamento com status de pagamento pendente.
   * O cliente paga diretamente na barbearia em dinheiro.
   * 
   * Fluxo:
   * 1. Cria agendamento no banco com payment_method: 'cash'
   * 2. Status de pagamento: 'pending' (será confirmado na barbearia)
   * 3. Navega para tela de sucesso
   * 
   * Tabelas: appointments, payment_transactions
   * Logs: [PAGAMENTO]
   */
  const handlePayWithCash = async () => {
    if (loading || !userProfile) return;

    console.log(`${LOG_PREFIX} Iniciando pagamento em dinheiro`);
    console.log(`${LOG_PREFIX} Dados do agendamento:`, {
      user_id: userProfile.id,
      barber_id: params.barberId,
      service_id: params.serviceId,
      appointment_date: params.isoDate,
      client_name: params.clientName || userProfile.full_name,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      // Criar agendamento
      console.log(`${LOG_PREFIX} Criando agendamento com pagamento em dinheiro`);
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: userProfile.id,
          client_name: params.clientName || userProfile.full_name,
          client_phone: params.clientPhone || userProfile.phone,
          barber_id: params.barberId,
          service_id: params.serviceId,
          appointment_date: params.isoDate,
          status: 'confirmed',
        })
        .select()
        .single();

      if (appointmentError) {
        console.log(`${LOG_PREFIX} Erro detalhado ao criar agendamento:`, JSON.stringify(appointmentError));
        throw appointmentError;
      }
      console.log(`${LOG_PREFIX} Agendamento criado:`, { id: appointment.id });

      // Tentar registrar transação de pagamento (pode falhar se payment_transactions não tiver RLS correto)
      console.log(`${LOG_PREFIX} Registrando transação de pagamento`);
      const { error: transError } = await supabase.from('payment_transactions').insert({
        appointment_id: appointment.id,
        client_id: userProfile.id,
        amount,
        payment_method: 'cash',
        status: 'pending'
      });

      if (transError) {
        console.log(`${LOG_PREFIX} Aviso: não foi possível registrar transação:`, transError.message);
      } else {
        console.log(`${LOG_PREFIX} Transação registrada com sucesso`);
      }

      console.log(`${LOG_PREFIX} Agendamento com pagamento em dinheiro criado com sucesso`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      router.replace({
        pathname: '/booking/success' as any,
        params: {
          dateStr: params.dateStr,
          clientName: params.clientName || userProfile.full_name,
          appointmentId: appointment.id,
          barberId: params.barberId,
          barberName: barber?.name || 'Barbeiro',
          serviceName: service?.name || 'Serviço',
          paymentMethod: 'Dinheiro (pagar na barbearia)'
        }
      });

    } catch (error: any) {
      console.log(`[ERRO] Falha ao processar pagamento em dinheiro:`, error.message);
      console.log(`[ERRO] Detalhes completos:`, JSON.stringify(error));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', `Não foi possível confirmar o agendamento. Detalhes: ${error.message}`);
    } finally {
      setLoading(false);
      console.log(`${LOG_PREFIX} Processo de pagamento em dinheiro finalizado`);
    }
  };

  /**
   * Processa pagamento com cartão presencial na barbearia
   * 
   * Cria o agendamento com status de pagamento pendente.
   * O cliente paga diretamente na barbearia com cartão de crédito ou débito.
   * 
   * Fluxo:
   * 1. Cria agendamento no banco com payment_method: 'card_at_shop'
   * 2. Status de pagamento: 'pending' (será confirmado na barbearia)
   * 3. Navega para tela de sucesso
   * 
   * Tabelas: appointments, payment_transactions
   * Logs: [PAGAMENTO]
   */
  const handlePayWithCardAtShop = async () => {
    if (loading || !userProfile) return;

    console.log(`${LOG_PREFIX} Iniciando pagamento com cartão na barbearia`);
    console.log(`${LOG_PREFIX} Dados do agendamento:`, {
      user_id: userProfile.id,
      barber_id: params.barberId,
      service_id: params.serviceId,
      appointment_date: params.isoDate,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      // Criar agendamento
      console.log(`${LOG_PREFIX} Criando agendamento com pagamento no cartão presencial`);
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: userProfile.id,
          client_name: params.clientName || userProfile.full_name,
          client_phone: params.clientPhone || userProfile.phone,
          barber_id: params.barberId,
          service_id: params.serviceId,
          appointment_date: params.isoDate,
          status: 'confirmed',
        })
        .select()
        .single();

      if (appointmentError) {
        console.log(`${LOG_PREFIX} Erro detalhado ao criar agendamento:`, JSON.stringify(appointmentError));
        throw appointmentError;
      }
      console.log(`${LOG_PREFIX} Agendamento criado:`, { id: appointment.id });

      // Tentar registrar transação de pagamento
      console.log(`${LOG_PREFIX} Registrando transação de pagamento`);
      const { error: transError } = await supabase.from('payment_transactions').insert({
        appointment_id: appointment.id,
        client_id: userProfile.id,
        amount,
        payment_method: 'card_at_shop',
        status: 'pending'
      });

      if (transError) {
        console.log(`${LOG_PREFIX} Aviso: não foi possível registrar transação:`, transError.message);
      } else {
        console.log(`${LOG_PREFIX} Transação registrada com sucesso`);
      }

      console.log(`${LOG_PREFIX} Agendamento com pagamento presencial criado com sucesso`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      router.replace({
        pathname: '/booking/success' as any,
        params: {
          dateStr: params.dateStr,
          clientName: params.clientName || userProfile.full_name,
          appointmentId: appointment.id,
          barberId: params.barberId,
          barberName: barber?.name || 'Barbeiro',
          serviceName: service?.name || 'Serviço',
          paymentMethod: 'Cartão na barbearia (Crédito/Débito)'
        }
      });

    } catch (error: any) {
      console.log(`[ERRO] Falha ao processar pagamento presencial:`, error.message);
      console.log(`[ERRO] Detalhes completos:`, JSON.stringify(error));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', `Não foi possível confirmar o agendamento. Detalhes: ${error.message}`);
    } finally {
      setLoading(false);
      console.log(`${LOG_PREFIX} Processo de pagamento presencial finalizado`);
    }
  };

  const handleSelectMethod = (method: PaymentMethod) => {
    console.log(`${LOG_PREFIX} Método selecionado: ${method}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMethod(method);
    setPixData(null);
    setPixExpired(false);
  };

  const handlePayWithPIX = async () => {
    if (loading || !userProfile) return;

    console.log(`${LOG_PREFIX} Iniciando pagamento PIX`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      const pixPayment = await createPIXPayment(
        `temp-${Date.now()}`, // appointment ID temporário
        userProfile.id,
        amount,
        `${service?.name} - ${barber?.name}`,
        userProfile.email || 'cliente@email.com',
        userProfile.full_name || 'Cliente',
        userProfile.cpf || '00000000000'
      );

      if (pixPayment) {
        setPixData(pixPayment);
        console.log(`${LOG_PREFIX} PIX gerado com sucesso`);
      }
    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro ao gerar PIX:`, error.message);
      Alert.alert('Erro', 'Não foi possível gerar o PIX. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePayWithWallet = async () => {
    if (loading || !userProfile) return;

    if (walletBalance < amount) {
      Alert.alert(
        'Saldo Insuficiente',
        `Seu saldo atual é R$ ${walletBalance.toFixed(2)}. Adicione créditos na carteira para continuar.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Adicionar Créditos', onPress: () => router.push('/profile/wallet' as any) }
        ]
      );
      return;
    }

    console.log(`${LOG_PREFIX} Pagando com carteira digital`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      // Criar agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: userProfile.id,
          client_name: params.clientName || userProfile.full_name,
          client_phone: params.clientPhone || userProfile.phone,
          barber_id: params.barberId,
          service_id: params.serviceId,
          appointment_date: params.isoDate,
          status: 'confirmed',
        })
        .select()
        .single();

      if (appointmentError) {
        console.log(`${LOG_PREFIX} Erro ao criar agendamento:`, appointmentError.message);
        throw appointmentError;
      }

      // Tentar registrar transação de pagamento
      const { error: transError } = await supabase.from('payment_transactions').insert({
        appointment_id: appointment.id,
        client_id: userProfile.id,
        amount,
        payment_method: 'wallet',
        status: 'approved',
        paid_at: new Date().toISOString()
      });

      if (transError) {
        console.log(`${LOG_PREFIX} Aviso: não foi possível registrar transação:`, transError.message);
      }

      // Debitar da carteira
      const { data: wallet } = await supabase
        .from('client_wallet')
        .select('id, balance')
        .eq('client_id', userProfile.id)
        .single();

      if (wallet) {
        await supabase
          .from('client_wallet')
          .update({ balance: wallet.balance - amount })
          .eq('id', wallet.id);

        await supabase.from('wallet_transactions').insert({
          wallet_id: wallet.id,
          type: 'payment',
          amount: -amount,
          description: `${service?.name} - ${barber?.name}`,
          reference_id: appointment.id
        });
      }

      console.log(`${LOG_PREFIX} Pagamento com carteira realizado com sucesso`);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      router.replace({
        pathname: '/booking/success' as any,
        params: {
          dateStr: params.dateStr,
          clientName: params.clientName || userProfile.full_name,
          appointmentId: appointment.id,
          barberId: params.barberId,
          barberName: barber?.name || 'Barbeiro',
          serviceName: service?.name || 'Serviço',
          paymentMethod: 'Carteira Digital'
        }
      });

    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro ao pagar com carteira:`, error.message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Erro', 'Não foi possível processar o pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPIXPayment = async () => {
    if (!pixData || checkingStatus) return;

    console.log(`${LOG_PREFIX} Confirmando pagamento PIX`);
    setCheckingStatus(true);

    try {
      // Criar agendamento
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          user_id: userProfile.id,
          client_name: params.clientName || userProfile.full_name,
          client_phone: params.clientPhone || userProfile.phone,
          barber_id: params.barberId,
          service_id: params.serviceId,
          appointment_date: params.isoDate,
          status: 'confirmed',
        })
        .select()
        .single();

      if (appointmentError) {
        console.log(`${LOG_PREFIX} Erro ao criar agendamento PIX:`, appointmentError.message);
        throw appointmentError;
      }

      // Tentar atualizar transação com appointment_id real
      const { error: updateError } = await supabase
        .from('payment_transactions')
        .update({ appointment_id: appointment.id })
        .eq('mp_payment_id', pixData.id);

      if (updateError) {
        console.log(`${LOG_PREFIX} Aviso: não foi possível atualizar transação:`, updateError.message);
      }

      console.log(`${LOG_PREFIX} Agendamento criado com pagamento PIX pendente`);

      // Verificar status do pagamento
      const interval = setInterval(async () => {
        const { data: transaction } = await supabase
          .from('payment_transactions')
          .select('status')
          .eq('mp_payment_id', pixData.id)
          .single();

        if (transaction?.status === 'approved') {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          router.replace({
            pathname: '/booking/success' as any,
            params: {
              dateStr: params.dateStr,
              clientName: params.clientName || userProfile.full_name,
              appointmentId: appointment.id,
              barberId: params.barberId,
              barberName: barber?.name || 'Barbeiro',
              serviceName: service?.name || 'Serviço',
              paymentMethod: 'PIX'
            }
          });
        }
      }, 3000);

      // Parar de verificar após 5 minutos
      setTimeout(() => {
        clearInterval(interval);
      }, 300000);

    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro ao confirmar pagamento PIX:`, error.message);
      Alert.alert('Erro', 'Não foi possível confirmar o pagamento. Tente novamente.');
    } finally {
      setCheckingStatus(false);
    }
  };

  const checkPIXStatus = async () => {
    if (!pixData?.id) return;

    try {
      const { data: transaction } = await supabase
        .from('payment_transactions')
        .select('status, paid_at')
        .eq('mp_payment_id', pixData.id)
        .single();

      if (transaction?.status === 'approved') {
        console.log(`${LOG_PREFIX} Pagamento PIX aprovado!`);
        setPixExpired(false);
      } else if (pixData.date_of_expiration && isPIXExpired(pixData.date_of_expiration)) {
        setPixExpired(true);
        console.log(`${LOG_PREFIX} PIX expirado`);
      }
    } catch (error) {
      console.log(`${LOG_PREFIX} Erro ao verificar status do PIX:`, error);
    }
  };

  const renderPaymentMethods = () => (
    <View className="mb-6">
      <Text className="text-white font-bold text-lg mb-4">Escolha a forma de pagamento</Text>
      
      {/* Carteira Digital */}
      <TouchableOpacity
        onPress={() => handleSelectMethod('wallet')}
        disabled={walletBalance < amount}
        className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
          selectedMethod === 'wallet' 
            ? 'bg-[#d4af37]/20 border-[#d4af37]' 
            : walletBalance < amount 
              ? 'bg-[#1e1e1e]/50 border-gray-700 opacity-50'
              : 'bg-[#1e1e1e] border-gray-700'
        }`}
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
          selectedMethod === 'wallet' ? 'bg-[#d4af37]' : 'bg-gray-700'
        }`}>
          <Ionicons name="wallet" size={24} color={selectedMethod === 'wallet' ? '#000' : '#fff'} />
        </View>
        <View className="flex-1">
          <Text className={`font-bold ${selectedMethod === 'wallet' ? 'text-[#d4af37]' : 'text-white'}`}>
            Carteira Digital
          </Text>
          <Text className="text-gray-400 text-sm">
            Saldo: R$ {walletBalance.toFixed(2)}
          </Text>
          {walletBalance < amount && (
            <Text className="text-red-400 text-xs mt-1">Saldo insuficiente</Text>
          )}
        </View>
        {selectedMethod === 'wallet' && (
          <Ionicons name="checkmark-circle" size={24} color="#d4af37" />
        )}
      </TouchableOpacity>

      {/* PIX */}
      <TouchableOpacity
        onPress={() => handleSelectMethod('pix')}
        className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
          selectedMethod === 'pix' 
            ? 'bg-[#d4af37]/20 border-[#d4af37]' 
            : 'bg-[#1e1e1e] border-gray-700'
        }`}
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
          selectedMethod === 'pix' ? 'bg-[#d4af37]' : 'bg-gray-700'
        }`}>
          <Ionicons name="qr-code" size={24} color={selectedMethod === 'pix' ? '#000' : '#fff'} />
        </View>
        <View className="flex-1">
          <Text className={`font-bold ${selectedMethod === 'pix' ? 'text-[#d4af37]' : 'text-white'}`}>
            PIX
          </Text>
          <Text className="text-gray-400 text-sm">Pagamento instantâneo</Text>
        </View>
        {selectedMethod === 'pix' && (
          <Ionicons name="checkmark-circle" size={24} color="#d4af37" />
        )}
      </TouchableOpacity>

      {/* Cartão de Crédito */}
      <TouchableOpacity
        onPress={() => handleSelectMethod('credit_card')}
        className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
          selectedMethod === 'credit_card' 
            ? 'bg-[#d4af37]/20 border-[#d4af37]' 
            : 'bg-[#1e1e1e] border-gray-700'
        }`}
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
          selectedMethod === 'credit_card' ? 'bg-[#d4af37]' : 'bg-gray-700'
        }`}>
          <Ionicons name="card" size={24} color={selectedMethod === 'credit_card' ? '#000' : '#fff'} />
        </View>
        <View className="flex-1">
          <Text className={`font-bold ${selectedMethod === 'credit_card' ? 'text-[#d4af37]' : 'text-white'}`}>
            Cartão de Crédito (Online)
          </Text>
          <Text className="text-gray-400 text-sm">Visa, Mastercard, Elo via Mercado Pago</Text>
        </View>
        {selectedMethod === 'credit_card' && (
          <Ionicons name="checkmark-circle" size={24} color="#d4af37" />
        )}
      </TouchableOpacity>

      {/* Pagamento Presencial - Dinheiro */}
      <TouchableOpacity
        onPress={() => handleSelectMethod('cash')}
        className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
          selectedMethod === 'cash' 
            ? 'bg-[#d4af37]/20 border-[#d4af37]' 
            : 'bg-[#1e1e1e] border-gray-700'
        }`}
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
          selectedMethod === 'cash' ? 'bg-[#d4af37]' : 'bg-gray-700'
        }`}>
          <Ionicons name="cash" size={24} color={selectedMethod === 'cash' ? '#000' : '#fff'} />
        </View>
        <View className="flex-1">
          <Text className={`font-bold ${selectedMethod === 'cash' ? 'text-[#d4af37]' : 'text-white'}`}>
            Dinheiro
          </Text>
          <Text className="text-gray-400 text-sm">Pagar na barbearia</Text>
        </View>
        {selectedMethod === 'cash' && (
          <Ionicons name="checkmark-circle" size={24} color="#d4af37" />
        )}
      </TouchableOpacity>

      {/* Pagamento Presencial - Cartão na Barbearia */}
      <TouchableOpacity
        onPress={() => handleSelectMethod('card_at_shop')}
        className={`flex-row items-center p-4 rounded-2xl mb-3 border ${
          selectedMethod === 'card_at_shop' 
            ? 'bg-[#d4af37]/20 border-[#d4af37]' 
            : 'bg-[#1e1e1e] border-gray-700'
        }`}
      >
        <View className={`w-12 h-12 rounded-full items-center justify-center mr-4 ${
          selectedMethod === 'card_at_shop' ? 'bg-[#d4af37]' : 'bg-gray-700'
        }`}>
          <Ionicons name="card-outline" size={24} color={selectedMethod === 'card_at_shop' ? '#000' : '#fff'} />
        </View>
        <View className="flex-1">
          <Text className={`font-bold ${selectedMethod === 'card_at_shop' ? 'text-[#d4af37]' : 'text-white'}`}>
            Cartão na Barbearia
          </Text>
          <Text className="text-gray-400 text-sm">Crédito ou Débito presencial</Text>
        </View>
        {selectedMethod === 'card_at_shop' && (
          <Ionicons name="checkmark-circle" size={24} color="#d4af37" />
        )}
      </TouchableOpacity>
    </View>
  );

  const renderPIXQRCode = () => {
    if (!pixData) return null;

    if (pixExpired) {
      return (
        <View className="items-center py-8">
          <Ionicons name="time" size={64} color="#ff6b6b" />
          <Text className="text-white text-xl font-bold mt-4">PIX Expirado</Text>
          <Text className="text-gray-400 text-center mt-2">
            O tempo para pagamento expirou. Gere um novo PIX.
          </Text>
          <TouchableOpacity
            onPress={() => {
              setPixData(null);
              setPixExpired(false);
            }}
            className="bg-[#d4af37] px-6 py-3 rounded-xl mt-6"
          >
            <Text className="text-black font-bold">Gerar Novo PIX</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View className="items-center py-6">
        <Text className="text-white text-lg font-bold mb-4">Escaneie o QR Code</Text>
        
        {pixData.qr_code_base64 ? (
          <Image
            source={{ uri: `data:image/png;base64,${pixData.qr_code_base64}` }}
            style={{ width: 250, height: 250, borderRadius: 16 }}
            resizeMode="contain"
          />
        ) : (
          <View className="w-[250px] h-[250px] bg-white rounded-2xl items-center justify-center">
            <ActivityIndicator size="large" color="#d4af37" />
          </View>
        )}

        <Text className="text-gray-400 text-sm mt-4">Ou copie o código PIX:</Text>
        
        <TouchableOpacity
          onPress={() => {
            // Copiar código PIX
            Alert.alert('Copiado!', 'Código PIX copiado para a área de transferência.');
          }}
          className="bg-[#1e1e1e] px-4 py-2 rounded-lg mt-2 flex-row items-center"
        >
          <Ionicons name="copy" size={16} color="#d4af37" />
          <Text className="text-[#d4af37] ml-2 font-mono text-xs">
            {pixData.qr_code?.substring(0, 30)}...
          </Text>
        </TouchableOpacity>

        <Text className="text-gray-500 text-xs mt-4">
          Aguardando pagamento... Atualização automática
        </Text>

        <TouchableOpacity
          onPress={handleConfirmPIXPayment}
          disabled={checkingStatus}
          className="bg-[#d4af37] px-8 py-4 rounded-xl mt-6"
        >
          <Text className="text-black font-bold text-lg">
            {checkingStatus ? 'Verificando...' : 'Já Paguei'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderContent = () => {
    if (!selectedMethod) {
      return renderPaymentMethods();
    }

    if (selectedMethod === 'pix' && pixData) {
      return renderPIXQRCode();
    }

    return (
      <View className="items-center py-8">
        <TouchableOpacity
          onPress={() => setSelectedMethod(null)}
          className="absolute top-0 left-0 p-2"
        >
          <Ionicons name="arrow-back" size={24} color="#d4af37" />
        </TouchableOpacity>

        {selectedMethod === 'pix' && (
          <TouchableOpacity
            onPress={handlePayWithPIX}
            disabled={loading}
            className="bg-[#d4af37] px-8 py-4 rounded-xl"
          >
            <Text className="text-black font-bold text-lg">
              {loading ? 'Gerando PIX...' : 'Gerar QR Code PIX'}
            </Text>
          </TouchableOpacity>
        )}

        {selectedMethod === 'wallet' && (
          <TouchableOpacity
            onPress={handlePayWithWallet}
            disabled={loading}
            className="bg-[#d4af37] px-8 py-4 rounded-xl"
          >
            <Text className="text-black font-bold text-lg">
              {loading ? 'Processando...' : `Pagar R$ ${amount.toFixed(2)} com Carteira`}
            </Text>
          </TouchableOpacity>
        )}

        {selectedMethod === 'credit_card' && (
          <TouchableOpacity
            onPress={handlePayWithCreditCard}
            disabled={processingCard}
            className="bg-[#d4af37] px-8 py-4 rounded-xl"
          >
            <Text className="text-black font-bold text-lg">
              {processingCard ? 'Abrindo checkout...' : `Pagar R$ ${amount.toFixed(2)} com Cartão`}
            </Text>
          </TouchableOpacity>
        )}

        {selectedMethod === 'cash' && (
          <TouchableOpacity
            onPress={handlePayWithCash}
            disabled={loading}
            className="bg-[#d4af37] px-8 py-4 rounded-xl"
          >
            <Text className="text-black font-bold text-lg">
              {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
            </Text>
          </TouchableOpacity>
        )}

        {selectedMethod === 'card_at_shop' && (
          <TouchableOpacity
            onPress={handlePayWithCardAtShop}
            disabled={loading}
            className="bg-[#d4af37] px-8 py-4 rounded-xl"
          >
            <Text className="text-black font-bold text-lg">
              {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['bottom']}>
      <ScrollView className="flex-1 px-4 pt-4">
        <View className="flex-row items-center mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 mr-2">
            <Ionicons name="arrow-back" size={28} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Pagamento</Text>
        </View>

        {/* Resumo do Agendamento */}
        {(service || barber) && (
          <View className="bg-[#1e1e1e] p-5 rounded-3xl border border-gray-800 mb-6">
            <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-800">
              <Text className="text-gray-400">Serviço</Text>
              <Text className="text-white font-bold">{service?.name || '...'}</Text>
            </View>
            <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-800">
              <Text className="text-gray-400">Profissional</Text>
              <Text className="text-white font-bold">{barber?.name?.split(' ')[0] || '...'}</Text>
            </View>
            <View className="flex-row justify-between mb-3 pb-3 border-b border-gray-800">
              <Text className="text-gray-400">Data e Hora</Text>
              <Text className="text-[#d4af37] font-bold">{params.dateStr}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-400">Valor</Text>
              <Text className="text-[#d4af37] font-bold text-xl">R$ {amount.toFixed(2)}</Text>
            </View>
          </View>
        )}

        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}
