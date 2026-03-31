import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Alert, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { logger } from '../../lib/logger';
import { useRouter } from 'expo-router';

const LOG_PREFIX = '[ADMIN]';

export default function AdminScreen() {
  console.log('[ADMIN] ========== COMPONENTE ADMIN INICIADO ==========');
  
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'servicos' | 'profissionais' | 'clientes' | 'relatorios' | 'financeiro' | 'mensalistas' | 'caixa' | 'mais'>('dashboard');
  
  // =============================================
  // ESTADOS PARA CONTROLE DE ACESSO
  // =============================================
  const [userRole, setUserRole] = useState<'admin' | 'barber' | 'client'>('admin');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [agendaView, setAgendaView] = useState<'proximos' | 'ultimos' | 'bloqueios' | 'espera'>('proximos');

  // =============================================
  // ESTADOS PARA COMISSÕES
  // =============================================
  const [barberCommissions, setBarberCommissions] = useState<any[]>([]);
  const [commissionRecords, setCommissionRecords] = useState<any[]>([]);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [editingCommission, setEditingCommission] = useState<string | null>(null);
  const [commissionPercentage, setCommissionPercentage] = useState('50');

  // =============================================
  // ESTADOS PARA CONTROLE DE CAIXA
  // =============================================
  const [currentCashRegister, setCurrentCashRegister] = useState<any>(null);
  const [cashMovements, setCashMovements] = useState<any[]>([]);
  const [loadingCash, setLoadingCash] = useState(false);
  const [openingBalance, setOpeningBalance] = useState('');
  const [closingBalance, setClosingBalance] = useState('');
  const [cashMovementType, setCashMovementType] = useState<'income' | 'expense'>('income');
  const [cashMovementDesc, setCashMovementDesc] = useState('');
  const [cashMovementAmount, setCashMovementAmount] = useState('');
  const [showAddMovement, setShowAddMovement] = useState(false);

  // Dashboard Metrics - Expandido
  const [dashboardData, setDashboardData] = useState({
    // Métricas básicas
    appointmentsToday: 0,
    revenueToday: 0,
    revenueMonth: 0,
    activeClients: 0,
    activeSubscriptions: 0,
    pendingAppointments: 0,
    completedToday: 0,
    topBarber: null as any,
    recentAppointments: [] as any[],
    
    // Novas métricas
    occupancyRate: 0, // Taxa de ocupação (%)
    ticketAverage: 0, // Ticket médio
    clientsToday: [] as any[], // Próximos clientes com telefone
    popularServices: [] as any[], // Serviços mais populares
    weekComparison: { current: 0, previous: 0, change: 0 }, // Comparação semanal
    todayTimeline: [] as any[], // Timeline do dia
    recentReviews: [] as any[], // Avaliações recentes
  });
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  
  // Estados para gráficos do dashboard
  const [weeklyRevenue, setWeeklyRevenue] = useState<number[]>([0, 0, 0, 0, 0, 0, 0]);
  const [hourlyDistribution, setHourlyDistribution] = useState<{ hour: string; count: number }[]>([]);
  const [barberPerformance, setBarberPerformance] = useState<{ name: string; count: number }[]>([]);

  const [services, setServices] = useState<any[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const [barbers, setBarbers] = useState<any[]>([]);
  const [loadingBarbers, setLoadingBarbers] = useState(false);

  const [clientHistory, setClientHistory] = useState<any[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formDuration, setFormDuration] = useState('');

  const [formBarberName, setFormBarberName] = useState('');
  const [formBarberSpecialty, setFormBarberSpecialty] = useState('');

  // =============================================
  // ESTADOS PARA GERENCIAR COLABORADORES
  // =============================================
  const [barberAccounts, setBarberAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [selectedBarberForAccount, setSelectedBarberForAccount] = useState<any>(null);
  const [accountEmail, setAccountEmail] = useState('');
  const [accountPassword, setAccountPassword] = useState('');
  const [accountPermissions, setAccountPermissions] = useState<Record<string, boolean>>({
    can_view_dashboard: true,
    can_view_agenda: true,
    can_edit_appointments: true,
    can_view_clients: true,
    can_edit_clients: false,
    can_view_services: false,
    can_edit_services: false,
    can_view_team: false,
    can_edit_team: false,
    can_view_finance: false,
    can_view_commissions: false,
    can_view_cash_register: false,
    can_view_subscriptions: false,
    can_view_settings: false,
    can_manage_barbers: false,
  });
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // =============================================
  // ESTADOS PARA FUNCIONALIDADES MÉDIAS
  // =============================================

  // Avaliações
  const [reviews, setReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [barberRatings, setBarberRatings] = useState<Record<string, { avg: number; count: number }>>({});

  // Notificações Internas
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Metas por Barbeiro
  const [barberGoals, setBarberGoals] = useState<any[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [goalAppointments, setGoalAppointments] = useState('');
  const [goalRevenue, setGoalRevenue] = useState('');

  // Lista de Espera
  const [waitingList, setWaitingList] = useState<any[]>([]);
  const [loadingWaitingList, setLoadingWaitingList] = useState(false);
  const [showAddWaiting, setShowAddWaiting] = useState(false);
  const [waitingClientName, setWaitingClientName] = useState('');
  const [waitingClientPhone, setWaitingClientPhone] = useState('');
  const [waitingBarber, setWaitingBarber] = useState<any>(null);
  const [waitingService, setWaitingService] = useState<any>(null);
  const [waitingDate, setWaitingDate] = useState('');
  const [waitingTimeStart, setWaitingTimeStart] = useState('');
  const [waitingTimeEnd, setWaitingTimeEnd] = useState('');

  // =============================================
  // ESTADOS PARA FUNCIONALIDADES BAIXAS
  // =============================================

  // Sub-aba do menu "Mais"
  const [maisSubTab, setMaisSubTab] = useState<'indicacoes' | 'estoque' | 'fidelidade' | 'link' | 'permissoes' | 'chat'>('indicacoes');

  // Indicações
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loadingReferrals, setLoadingReferrals] = useState(false);
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [referralName, setReferralName] = useState('');
  const [referralPhone, setReferralPhone] = useState('');

  // Estoque
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productName, setProductName] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [productCostPrice, setProductCostPrice] = useState('');
  const [productSalePrice, setProductSalePrice] = useState('');
  const [productStock, setProductStock] = useState('');
  const [productMinStock, setProductMinStock] = useState('5');
  const [showStockMovement, setShowStockMovement] = useState<string | null>(null);
  const [stockMovementQty, setStockMovementQty] = useState('');
  const [stockMovementType, setStockMovementType] = useState<'entry' | 'exit' | 'sale'>('entry');
  const [stockMovementReason, setStockMovementReason] = useState('');

  // Fidelidade
  const [loyaltyRewards, setLoyaltyRewards] = useState<any[]>([]);
  const [loadingLoyalty, setLoadingLoyalty] = useState(false);
  const [showAddReward, setShowAddReward] = useState(false);
  const [rewardName, setRewardName] = useState('');
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardPointsCost, setRewardPointsCost] = useState('');
  const [topLoyaltyClients, setTopLoyaltyClients] = useState<any[]>([]);

  // Link Online
  const [onlineConfig, setOnlineConfig] = useState<any>(null);
  const [loadingOnlineConfig, setLoadingOnlineConfig] = useState(false);
  const [onlineSalonName, setOnlineSalonName] = useState('');
  const [onlineSalonPhone, setOnlineSalonPhone] = useState('');
  const [onlineSalonAddress, setOnlineSalonAddress] = useState('');
  const [onlineEnabled, setOnlineEnabled] = useState(true);

  // =============================================
  // ESTADOS PARA BLOQUEIO DE HORÁRIOS
  // =============================================
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [loadingBlocks, setLoadingBlocks] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [blockBarber, setBlockBarber] = useState<any>(null);
  const [blockDate, setBlockDate] = useState(new Date().toISOString().split('T')[0]);
  const [blockStartTime, setBlockStartTime] = useState('12:00');
  const [blockEndTime, setBlockEndTime] = useState('13:00');
  const [blockReason, setBlockReason] = useState('');
  const [blockIsRecurring, setBlockIsRecurring] = useState(false);
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all');

  // Financeiro
  const [financeFilter, setFinanceFilter] = useState<'hoje' | '15dias' | '30dias' | '60dias' | 'custom'>('hoje');
  const [financeData, setFinanceData] = useState<any>({ receitas: 0, despesas: 0, transacoes: [] });
  const [financeRealData, setFinanceRealData] = useState<any>({ receitas: 0, despesas: 0, transacoes: [] });
  const [loadingFinance, setLoadingFinance] = useState(false);
  const [financeSubTab, setFinanceSubTab] = useState<'resultado' | 'receitas' | 'despesas'>('resultado');
  const [financeViewMode, setFinanceViewMode] = useState<'previsao' | 'realizado'>('previsao');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [customStartYear, setCustomStartYear] = useState(new Date().getFullYear());
  const [customStartMonth, setCustomStartMonth] = useState(new Date().getMonth());
  const [customEndYear, setCustomEndYear] = useState(new Date().getFullYear());
  const [customEndMonth, setCustomEndMonth] = useState(new Date().getMonth());
  const [selectingField, setSelectingField] = useState<'start' | 'end'>('start');

  // Mensalistas
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loadingSubscriptions, setLoadingSubscriptions] = useState(false);
  const [subscriptionClients, setSubscriptionClients] = useState<any[]>([]);
  const [showAddSubscription, setShowAddSubscription] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [subscriptionCuts, setSubscriptionCuts] = useState('4');
  const [subscriptionPrice, setSubscriptionPrice] = useState('');
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [showUsageHistory, setShowUsageHistory] = useState<string | null>(null);
  const [usageHistory, setUsageHistory] = useState<any[]>([]);
  
  // Estados para detalhes expandidos do cliente
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [clientDetails, setClientDetails] = useState<any>(null);
  const [loadingClientDetails, setLoadingClientDetails] = useState(false);

  // =============================================
  // DASHBOARD - Buscar métricas
  // =============================================
  // =============================================
  // FUNÇÃO PARA CARREGAR PERMISSÕES DO USUÁRIO
  // =============================================

  /**
   * Atualiza permissões de um role na tabela
   * @param role - Role a ser atualizado (admin, barber)
   * @param perms - Objeto com as permissões
   */
  const updateRolePermissions = async (role: string, perms: Record<string, boolean>) => {
    logger.info(`Atualizando permissões do role: ${role}`);
    
    const { error } = await supabase
      .from('role_permissions')
      .upsert({
        role,
        ...perms,
        updated_at: new Date().toISOString()
      }, { onConflict: 'role' });

    if (error) {
      logger.error('Erro ao atualizar permissões', error);
      Alert.alert('Erro', 'Não foi possível atualizar as permissões');
    } else {
      logger.info('Permissões atualizadas com sucesso');
      Alert.alert('Sucesso', 'Permissões atualizadas! Reinicie o app para aplicar.');
    }
  };

  /**
   * Verifica se o usuário tem permissão para uma funcionalidade
   * Admin SEMPRE tem acesso total
   */
  const hasPermission = (permission: string): boolean => {
    // Admin tem acesso total - SEMPRE
    if (userRole === 'admin') {
      return true;
    }
    // Para outros roles, verificar permissão específica
    return permissions[permission] === true;
  };

  /**
   * Busca todas as métricas do dashboard
   * Inclui: ocupação, ticket médio, serviços populares, comparação semanal
   */
  const fetchDashboardData = async () => {
    setLoadingDashboard(true);
    logger.info('Buscando dados do dashboard...');

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    try {
      // Agendamentos hoje
      const { data: todayAppts } = await supabase
        .from('appointments')
        .select('*, services(name, price), barbers(name)')
        .gte('appointment_date', todayStart)
        .lt('appointment_date', todayEnd)
        .order('appointment_date', { ascending: true });

      // Faturamento hoje
      const revenueToday = todayAppts?.reduce((sum, a) => {
        const svc = Array.isArray(a.services) ? a.services[0] : a.services;
        return sum + (svc?.price || 0);
      }, 0) || 0;

      // Faturamento do mês
      const { data: monthAppts } = await supabase
        .from('appointments')
        .select('services(name, price)')
        .gte('appointment_date', monthStart)
        .eq('status', 'confirmed');

      const revenueMonth = monthAppts?.reduce((sum, a) => {
        const svc = Array.isArray(a.services) ? a.services[0] : a.services;
        return sum + (svc?.price || 0);
      }, 0) || 0;

      // Clientes ativos (últimos 30 dias)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data: activeClientsData } = await supabase
        .from('appointments')
        .select('user_id')
        .gte('appointment_date', thirtyDaysAgo)
        .not('user_id', 'is', null);

      const uniqueClients = new Set(activeClientsData?.map(a => a.user_id) || []);

      // Mensalistas ativos
      const { count: activeSubs } = await supabase
        .from('monthly_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Barbeiro com mais atendimentos hoje
      const barberCounts: Record<string, { name: string; count: number }> = {};
      todayAppts?.forEach(a => {
        const barberName = a.barbers?.name || 'Desconhecido';
        if (!barberCounts[barberName]) {
          barberCounts[barberName] = { name: barberName, count: 0 };
        }
        barberCounts[barberName].count++;
      });
      const topBarber = Object.values(barberCounts).sort((a, b) => b.count - a.count)[0] || null;

      // Próximos agendamentos
      const { data: upcomingAppts } = await supabase
        .from('appointments')
        .select('*, services(name), barbers(name)')
        .gte('appointment_date', now.toISOString())
        .order('appointment_date', { ascending: true })
        .limit(5);

      // NOVAS MÉTRICAS

      // 1. Taxa de Ocupação (% de horários preenchidos)
      const totalSlots = 18; // 9 slots por barbeiro (9h-18h) × barbeiros
      const occupancyRate = todayAppts ? Math.min(100, Math.round((todayAppts.length / Math.max(totalSlots, 1)) * 100)) : 0;

      // 2. Ticket Médio (receita / agendamentos)
      const ticketAverage = todayAppts && todayAppts.length > 0 
        ? revenueToday / todayAppts.length 
        : 0;

      // 3. Próximos Clientes com telefone (para contato rápido)
      const clientsToday = todayAppts
        ?.filter(a => new Date(a.appointment_date) > now && a.client_phone)
        .slice(0, 5)
        .map(a => ({
          id: a.id,
          name: a.client_name,
          phone: a.client_phone,
          time: new Date(a.appointment_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          service: Array.isArray(a.services) ? a.services[0]?.name : a.services?.name,
        })) || [];

      // 4. Serviços Mais Populares (últimos 30 dias)
      const { data: allServices } = await supabase
        .from('appointments')
        .select('services(name)')
        .gte('appointment_date', thirtyDaysAgo);

      const serviceCounts: Record<string, number> = {};
      allServices?.forEach(a => {
        const svc = Array.isArray(a.services) ? a.services[0]?.name : a.services?.name;
        if (svc) {
          serviceCounts[svc] = (serviceCounts[svc] || 0) + 1;
        }
      });
      const popularServices = Object.entries(serviceCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 5. Comparação Semanal
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      
      const { data: weekAppts } = await supabase
        .from('appointments')
        .select('services(price)')
        .gte('appointment_date', weekStart.toISOString());

      const { data: prevWeekAppts } = await supabase
        .from('appointments')
        .select('services(price)')
        .gte('appointment_date', twoWeeksAgo.toISOString())
        .lt('appointment_date', weekStart.toISOString());

      const weekRevenue = weekAppts?.reduce((sum, a) => {
        const svc = Array.isArray(a.services) ? a.services[0] : a.services;
        return sum + (svc?.price || 0);
      }, 0) || 0;

      const prevWeekRevenue = prevWeekAppts?.reduce((sum, a) => {
        const svc = Array.isArray(a.services) ? a.services[0] : a.services;
        return sum + (svc?.price || 0);
      }, 0) || 0;

      const weekChange = prevWeekRevenue > 0 
        ? Math.round(((weekRevenue - prevWeekRevenue) / prevWeekRevenue) * 100)
        : 0;

      // 6. Timeline do Dia (visualização dos horários)
      const timeline = Array.from({ length: 10 }, (_, i) => {
        const hour = 9 + i;
        const hourStr = `${hour.toString().padStart(2, '0')}:00`;
        const hasAppointment = todayAppts?.some(a => {
          const d = new Date(a.appointment_date);
          return d.getHours() === hour;
        });
        return { hour: hourStr, occupied: hasAppointment };
      });

      // 7. Avaliações Recentes
      const { data: recentReviewsData } = await supabase
        .from('reviews')
        .select('*, profiles(full_name), barbers(name)')
        .order('created_at', { ascending: false })
        .limit(3);

      setDashboardData({
        appointmentsToday: todayAppts?.length || 0,
        revenueToday,
        revenueMonth,
        activeClients: uniqueClients.size,
        activeSubscriptions: activeSubs || 0,
        pendingAppointments: todayAppts?.filter(a => a.status === 'confirmed').length || 0,
        completedToday: todayAppts?.filter(a => new Date(a.appointment_date) < now).length || 0,
        topBarber,
        recentAppointments: upcomingAppts || [],
        
        // Novas métricas
        occupancyRate,
        ticketAverage,
        clientsToday,
        popularServices,
        weekComparison: { current: weekRevenue, previous: prevWeekRevenue, change: weekChange },
        todayTimeline: timeline,
        recentReviews: recentReviewsData || [],
      });

      // =============================================
      // DADOS PARA GRÁFICOS
      // =============================================
      
      // Gráfico 1: Faturamento dos últimos 7 dias
      const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
      const revenueByDay: number[] = [0, 0, 0, 0, 0, 0, 0];
      
      for (let i = 6; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayStart.getDate() + 1);
        
        const { data: dayAppts } = await supabase
          .from('appointments')
          .select('services(price)')
          .gte('appointment_date', dayStart.toISOString())
          .lt('appointment_date', dayEnd.toISOString());
        
        const dayRevenue = dayAppts?.reduce((sum, a) => {
          const svc = Array.isArray(a.services) ? a.services[0] : a.services;
          return sum + (svc?.price || 0);
        }, 0) || 0;
        
        revenueByDay[6 - i] = dayRevenue;
      }
      setWeeklyRevenue(revenueByDay);
      
      // Gráfico 2: Distribuição por horário (últimos 30 dias)
      const { data: allAppts30d } = await supabase
        .from('appointments')
        .select('appointment_date')
        .gte('appointment_date', thirtyDaysAgo);
      
      const hourCounts: Record<number, number> = {};
      allAppts30d?.forEach(a => {
        const hour = new Date(a.appointment_date).getHours();
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      });
      
      const hourlyData = Object.entries(hourCounts)
        .map(([hour, count]) => ({ hour: `${hour}h`, count }))
        .sort((a, b) => parseInt(a.hour) - parseInt(b.hour));
      setHourlyDistribution(hourlyData);
      
      // Gráfico 3: Desempenho dos barbeiros (últimos 30 dias)
      const { data: barberAppts } = await supabase
        .from('appointments')
        .select('barbers(name)')
        .gte('appointment_date', thirtyDaysAgo);
      
      const barberPerfCounts: Record<string, number> = {};
      barberAppts?.forEach(a => {
        const name = a.barbers?.name || 'Desconhecido';
        barberPerfCounts[name] = (barberPerfCounts[name] || 0) + 1;
      });
      
      const barberPerf = Object.entries(barberPerfCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      setBarberPerformance(barberPerf);

      logger.info(`Dashboard atualizado: ${todayAppts?.length || 0} agendamentos, ${occupancyRate}% ocupação`);
    } catch (e) {
      logger.error('Erro ao buscar dashboard', e);
    }
    setLoadingDashboard(false);
  };

  /**
   * Atualiza o status de um agendamento
   * @param appointmentId - ID do agendamento
   * @param newStatus - Novo status (confirmed, completed, cancelled)
   */
  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    const statusLabels: Record<string, string> = {
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado'
    };

    Alert.alert(
      'Alterar Status',
      `Marcar agendamento como ${statusLabels[newStatus]}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            logger.info(`Atualizando status do agendamento ${appointmentId} para ${newStatus}`);
            
            const { error } = await supabase
              .from('appointments')
              .update({ status: newStatus })
              .eq('id', appointmentId);

            if (error) {
              logger.data.update('appointments', appointmentId, false, error);
              Alert.alert('Erro', 'Não foi possível atualizar o status');
            } else {
              logger.data.update('appointments', appointmentId, true);
              fetchAppointments();
              
              if (newStatus === 'completed') {
                // Atualizar dados financeiros quando concluir atendimento
                fetchFinanceData();
                Alert.alert('Sucesso', 'Atendimento concluído! Receita contabilizada no financeiro.');
              } else if (newStatus === 'cancelled') {
                // Atualizar dados financeiros quando cancelar
                fetchFinanceData();
                Alert.alert('Sucesso', `Agendamento cancelado.`);
              } else {
                Alert.alert('Sucesso', `Status atualizado para ${statusLabels[newStatus]}`);
              }
            }
          }
        }
      ]
    );
  };

  const fetchAppointments = async () => {
    setLoadingAgenda(true);
    logger.info(`Buscando agendamentos (${agendaView})...`);
    try {
      let query = supabase
        .from('appointments')
        .select(`id, appointment_date, status, client_name, client_phone, services(name, price), barbers(name)`);

      if (agendaView === 'proximos') {
        // Próximos agendamentos (a partir de agora)
        query = query
          .gte('appointment_date', new Date().toISOString())
          .order('appointment_date', { ascending: true })
          .limit(20);
      } else {
        // Últimos agendamentos (já realizados)
        query = query
          .lt('appointment_date', new Date().toISOString())
          .order('appointment_date', { ascending: false })
          .limit(20);
      }

      const { data, error } = await query;
      
      if (error) {
        logger.data.fetch('appointments', null, error);
      } else if (data) {
        logger.data.fetch('appointments', data.length);
        setAppointments(data);
      }
    } catch (e) {
      logger.error('Exceção ao buscar agendamentos', e);
    }
    setLoadingAgenda(false);
  };

  const fetchServices = async () => {
    setLoadingServices(true);
    logger.info('Buscando serviços...');
    const { data, error } = await supabase.from('services').select('*').order('price', { ascending: true });
    if (error) {
      logger.data.fetch('services', null, error);
    } else if (data) {
      logger.data.fetch('services', data.length);
      setServices(data);
    }
    setLoadingServices(false);
  };

  const fetchBarbers = async () => {
    setLoadingBarbers(true);
    logger.info('Buscando barbeiros...');
    const { data, error } = await supabase.from('barbers').select('*').order('name', { ascending: true });
    if (error) {
      logger.data.fetch('barbers', null, error);
    } else if (data) {
      logger.data.fetch('barbers', data.length);
      setBarbers(data);
    }
    setLoadingBarbers(false);
  };

  const fetchClientHistory = async () => {
    setLoadingClients(true);
    logger.info('Buscando clientes...');
    try {
      // Buscar clientes cadastrados na tabela profiles (incluindo notes)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, phone, notes')
        .eq('role', 'client')
        .order('full_name', { ascending: true });

      if (profileError) {
        logger.data.fetch('profiles (clientes)', null, profileError);
      } else {
        logger.data.fetch('profiles (clientes)', profiles?.length || 0);
      }

      // Buscar agendamentos para calcular estatísticas
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('user_id, client_name, client_phone, appointment_date, services(name, price)')
        .order('appointment_date', { ascending: false });

      if (apptError) {
        console.error('Erro ao buscar agendamentos:', apptError);
      }

      // Criar mapa de estatísticas por user_id
      const statsMap: Record<string, any> = {};
      if (appointments) {
        appointments.forEach((a) => {
          const svc = Array.isArray(a.services) ? a.services[0] : a.services;
          const key = a.user_id || a.client_name?.toLowerCase().trim();
          if (!key) return;
          
          if (!statsMap[key]) {
            statsMap[key] = {
              visits: 0,
              total: 0,
              lastDate: a.appointment_date,
              lastService: svc?.name,
            };
          }
          statsMap[key].visits++;
          statsMap[key].total += svc?.price || 0;
          if (a.appointment_date > statsMap[key].lastDate) {
            statsMap[key].lastDate = a.appointment_date;
            statsMap[key].lastService = svc?.name;
          }
        });
      }

      // Combinar profiles com estatísticas
      const clientsList = (profiles || []).map((profile) => {
        const stats = statsMap[profile.id] || { visits: 0, total: 0, lastDate: null, lastService: null };
        return {
          id: profile.id,
          name: profile.full_name,
          phone: profile.phone,
          notes: profile.notes || '',
          visits: stats.visits,
          total: stats.total,
          lastDate: stats.lastDate,
          lastService: stats.lastService,
        };
      });

      // Adicionar clientes que agendaram mas não estão na lista (sem user_id)
      if (appointments) {
        appointments.forEach((a) => {
          if (!a.user_id && a.client_name) {
            const key = a.client_name.toLowerCase().trim();
            const exists = clientsList.some(c => c.name.toLowerCase().trim() === key);
            if (!exists) {
              const stats = statsMap[key] || { visits: 0, total: 0, lastDate: null, lastService: null };
              clientsList.push({
                id: key,
                name: a.client_name,
                phone: a.client_phone,
                createdAt: null,
                visits: stats.visits,
                total: stats.total,
                lastDate: stats.lastDate,
                lastService: stats.lastService,
              });
            }
          }
        });
      }

      // Ordenar por mais visitas
      clientsList.sort((a, b) => b.visits - a.visits);
      
      setClientHistory(clientsList);
    } catch (e) {
      console.error('Erro ao buscar clientes:', e);
    }
    setLoadingClients(false);
  };

  const openWhatsApp = (phone: string) => {
    if (!phone) {
      Alert.alert('Aviso', 'Cliente não possui telefone cadastrado');
      return;
    }
    // Remove caracteres não numéricos
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=55${cleanPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'WhatsApp não instalado');
    });
  };

  const makePhoneCall = (phone: string) => {
    if (!phone) {
      Alert.alert('Aviso', 'Cliente não possui telefone cadastrado');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    Linking.openURL(`tel:${cleanPhone}`);
  };

  const saveClientNote = async (clientId: string) => {
    logger.info(`Salvando observação para cliente: ${clientId}`);
    
    const { error } = await supabase
      .from('profiles')
      .update({ notes: noteText })
      .eq('id', clientId);
    
    if (error) {
      logger.data.update('profiles', clientId, false, error);
      Alert.alert('Erro', 'Não foi possível salvar a observação');
    } else {
      logger.data.update('profiles', clientId, true);
      setEditingNote(null);
      setNoteText('');
      fetchClientHistory(); // Recarregar lista
      Alert.alert('Sucesso', 'Observação salva!');
    }
  };

  const startEditingNote = (clientId: string, currentNote: string) => {
    setEditingNote(clientId);
    setNoteText(currentNote || '');
  };

  // Carregar detalhes expandidos do cliente
  const loadClientDetails = async (clientId: string) => {
    if (expandedClient === clientId) {
      setExpandedClient(null);
      return;
    }
    
    setExpandedClient(clientId);
    setLoadingClientDetails(true);
    console.log(`${LOG_PREFIX} Carregando detalhes do cliente: ${clientId}`);
    
    try {
      const [walletRes, loyaltyRes, preferencesRes, recurringRes, photosRes] = await Promise.all([
        supabase.from('client_wallet').select('*').eq('user_id', clientId).single(),
        supabase.from('loyalty_points').select('*').eq('user_id', clientId).single(),
        supabase.from('client_preferences').select('*, barbers(name), services(name)').eq('user_id', clientId).single(),
        supabase.from('recurring_appointments').select('*, services(name), barbers(name)').eq('user_id', clientId).eq('is_active', true).single(),
        supabase.from('client_photos').select('*').eq('user_id', clientId).order('created_at', { ascending: false }).limit(6),
      ]);
      
      setClientDetails({
        wallet: walletRes.data,
        loyalty: loyaltyRes.data,
        preferences: preferencesRes.data,
        recurring: recurringRes.data,
        photos: photosRes.data || [],
      });
      
      console.log(`${LOG_PREFIX} Detalhes carregados para cliente: ${clientId}`);
    } catch (error: any) {
      console.log(`[ERRO] ${LOG_PREFIX} Falha ao carregar detalhes:`, error.message);
    }
    setLoadingClientDetails(false);
  };

  // =============================================
  // FUNÇÕES DE MENSALISTAS
  // =============================================

  const fetchSubscriptions = async () => {
    setLoadingSubscriptions(true);
    logger.info('Buscando mensalistas...');
    
    const { data, error } = await supabase
      .from('monthly_subscriptions')
      .select(`
        *,
        profiles:user_id (id, full_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      logger.data.fetch('monthly_subscriptions', null, error);
    } else if (data) {
      logger.data.fetch('monthly_subscriptions', data.length);
      setSubscriptions(data);
    }
    setLoadingSubscriptions(false);
  };

  const fetchSubscriptionClients = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'client')
      .order('full_name', { ascending: true });
    
    if (data) setSubscriptionClients(data);
  };

  const addSubscription = async () => {
    if (!selectedClient) {
      Alert.alert('Erro', 'Selecione um cliente');
      return;
    }

    logger.info(`Adicionando mensalista: ${selectedClient.full_name}`);
    
    const { error } = await supabase
      .from('monthly_subscriptions')
      .insert({
        user_id: selectedClient.id,
        total_cuts: parseInt(subscriptionCuts),
        price: subscriptionPrice ? parseFloat(subscriptionPrice) : null,
        status: 'active'
      });

    if (error) {
      logger.data.insert('monthly_subscriptions', false, error);
      Alert.alert('Erro', 'Não foi possível cadastrar o mensalista');
    } else {
      logger.data.insert('monthly_subscriptions', true);
      setShowAddSubscription(false);
      setSelectedClient(null);
      setSubscriptionCuts('4');
      setSubscriptionPrice('');
      fetchSubscriptions();
      Alert.alert('Sucesso', 'Mensalista cadastrado!');
    }
  };

  const fetchUsageHistory = async (subscriptionId: string) => {
    const { data } = await supabase
      .from('subscription_usage')
      .select('*')
      .eq('subscription_id', subscriptionId)
      .order('used_at', { ascending: false });

    if (data) {
      setUsageHistory(data);
      setShowUsageHistory(subscriptionId);
    }
  };

  const cancelSubscription = async (id: string) => {
    Alert.alert(
      'Confirmar Cancelamento',
      'Deseja cancelar esta assinatura?',
      [
        { text: 'Não', style: 'cancel' },
        { 
          text: 'Sim, Cancelar', 
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('monthly_subscriptions')
              .update({ status: 'cancelled' })
              .eq('id', id);
            fetchSubscriptions();
          }
        }
      ]
    );
  };

  const renewSubscription = async (id: string, newCuts: string) => {
    const { error } = await supabase
      .from('monthly_subscriptions')
      .update({ 
        total_cuts: parseInt(newCuts),
        used_cuts: 0,
        status: 'active',
        start_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', id);

    if (!error) {
      fetchSubscriptions();
      Alert.alert('Sucesso', 'Assinatura renovada!');
    }
  };

  // =============================================
  // FUNÇÕES DE BLOQUEIO DE HORÁRIOS
  // =============================================

  /**
   * Busca todos os bloqueios de horário cadastrados
   * Inclui dados do barbeiro associado
   */
  const fetchScheduleBlocks = async () => {
    setLoadingBlocks(true);
    logger.info('Buscando bloqueios de horário...');

    const { data, error } = await supabase
      .from('schedule_blocks')
      .select('*, barbers(id, name)')
      .gte('block_date', new Date().toISOString().split('T')[0])
      .order('block_date', { ascending: true });

    if (error) {
      logger.data.fetch('schedule_blocks', null, error);
    } else if (data) {
      logger.data.fetch('schedule_blocks', data.length);
      setScheduleBlocks(data);
    }
    setLoadingBlocks(false);
  };

  /**
   * Adiciona um novo bloqueio de horário
   * Valida dados e salva no banco
   */
  const addScheduleBlock = async () => {
    // Validações
    if (!blockBarber) {
      Alert.alert('Erro', 'Selecione um barbeiro');
      return;
    }
    if (!blockDate) {
      Alert.alert('Erro', 'Selecione uma data');
      return;
    }
    if (!blockStartTime || !blockEndTime) {
      Alert.alert('Erro', 'Preencha os horários de início e fim');
      return;
    }
    if (blockStartTime >= blockEndTime) {
      Alert.alert('Erro', 'Horário de início deve ser menor que o horário de fim');
      return;
    }

    logger.info(`Adicionando bloqueio para ${blockBarber.name} em ${blockDate}`);

    // Calcular dia da semana para bloqueios recorrentes
    const dateObj = new Date(blockDate + 'T12:00:00');
    const dayOfWeek = dateObj.getDay();

    const { error } = await supabase
      .from('schedule_blocks')
      .insert({
        barber_id: blockBarber.id,
        block_date: blockDate,
        start_time: blockStartTime,
        end_time: blockEndTime,
        reason: blockReason || 'Bloqueado',
        is_recurring: blockIsRecurring,
        recurring_day: blockIsRecurring ? dayOfWeek : null,
      });

    if (error) {
      logger.data.insert('schedule_blocks', false, error);
      Alert.alert('Erro', 'Não foi possível adicionar o bloqueio');
    } else {
      logger.data.insert('schedule_blocks', true);
      setShowAddBlock(false);
      resetBlockForm();
      fetchScheduleBlocks();
      Alert.alert('Sucesso', 'Bloqueio adicionado!');
    }
  };

  /**
   * Remove um bloqueio de horário
   * @param id - ID do bloqueio a ser removido
   */
  const removeScheduleBlock = async (id: string) => {
    Alert.alert(
      'Confirmar Remoção',
      'Deseja remover este bloqueio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            logger.info(`Removendo bloqueio: ${id}`);
            const { error } = await supabase
              .from('schedule_blocks')
              .delete()
              .eq('id', id);

            if (error) {
              logger.data.delete('schedule_blocks', id, false, error);
              Alert.alert('Erro', 'Não foi possível remover o bloqueio');
            } else {
              logger.data.delete('schedule_blocks', id, true);
              fetchScheduleBlocks();
              Alert.alert('Sucesso', 'Bloqueio removido!');
            }
          }
        }
      ]
    );
  };

  /**
   * Reseta o formulário de bloqueio para valores padrão
   */
  const resetBlockForm = () => {
    setBlockBarber(null);
    setBlockDate(new Date().toISOString().split('T')[0]);
    setBlockStartTime('12:00');
    setBlockEndTime('13:00');
    setBlockReason('');
    setBlockIsRecurring(false);
  };

  /**
   * Adiciona bloqueio rápido de almoço (12:00-13:00)
   * para todos os barbeiros em uma data específica
   */
  const addLunchBlockForAll = async () => {
    if (barbers.length === 0) {
      Alert.alert('Erro', 'Nenhum barbeiro cadastrado');
      return;
    }

    Alert.alert(
      'Bloquear Almoço',
      'Deseja bloquear o horário de almoço (12:00-13:00) para todos os barbeiros hoje?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          onPress: async () => {
            const today = new Date().toISOString().split('T')[0];
            const blocks = barbers.map(b => ({
              barber_id: b.id,
              block_date: today,
              start_time: '12:00',
              end_time: '13:00',
              reason: 'Almoço',
              is_recurring: false,
            }));

            const { error } = await supabase
              .from('schedule_blocks')
              .insert(blocks);

            if (!error) {
              fetchScheduleBlocks();
              Alert.alert('Sucesso', 'Horário de almoço bloqueado para todos!');
            }
          }
        }
      ]
    );
  };

  const getDateRange = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const oneDay = 86400000;
    
    switch(filter) {
      case 'hoje':
        return { start: today.toISOString(), end: new Date(today.getTime() + oneDay).toISOString() };
      case '15dias':
        return { start: today.toISOString(), end: new Date(today.getTime() + 15 * oneDay).toISOString() };
      case '30dias':
        return { start: today.toISOString(), end: new Date(today.getTime() + 30 * oneDay).toISOString() };
      case '60dias':
        return { start: today.toISOString(), end: new Date(today.getTime() + 60 * oneDay).toISOString() };
      case 'custom':
        if (customStart && customEnd) {
          const start = new Date(customStart + 'T00:00:00');
          const end = new Date(customEnd + 'T23:59:59');
          return { start: start.toISOString(), end: end.toISOString() };
        }
        return { start: today.toISOString(), end: new Date(today.getTime() + oneDay).toISOString() };
      default:
        return { start: today.toISOString(), end: new Date(today.getTime() + oneDay).toISOString() };
    }
  };

  const getFilterLabel = (filter: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
    const oneDay = 86400000;
    
    switch(filter) {
      case 'hoje': 
        return `Hoje - ${formatDate(today)}`;
      case '15dias':
        const fim15 = new Date(today.getTime() + 15 * oneDay);
        return `Próximos 15 Dias: ${formatDate(today)} → ${formatDate(fim15)}`;
      case '30dias':
        const fim30 = new Date(today.getTime() + 30 * oneDay);
        return `Próximos 30 Dias: ${formatDate(today)} → ${formatDate(fim30)}`;
      case '60dias':
        const fim60 = new Date(today.getTime() + 60 * oneDay);
        return `Próximos 60 Dias: ${formatDate(today)} → ${formatDate(fim60)}`;
      case 'custom':
        if (customStart && customEnd) {
          return `Personalizado: ${formatDate(new Date(customStart + 'T12:00:00'))} → ${formatDate(new Date(customEnd + 'T12:00:00'))}`;
        }
        return 'Selecione um período';
      default:
        return 'Selecione um período';
    }
  };

  // =============================================
  // FUNÇÕES DE COMISSÕES
  // =============================================

  /**
   * Busca configurações de comissão de todos os barbeiros
   */
  const fetchBarberCommissions = async () => {
    setLoadingCommissions(true);
    logger.info('Buscando comissões dos barbeiros...');

    const { data, error } = await supabase
      .from('barber_commissions')
      .select('*, barbers(id, name)')
      .order('created_at', { ascending: false });

    if (error) {
      logger.data.fetch('barber_commissions', null, error);
    } else if (data) {
      logger.data.fetch('barber_commissions', data.length);
      setBarberCommissions(data);
    }
    setLoadingCommissions(false);
  };

  /**
   * Busca registros de comissões ganhas
   */
  const fetchCommissionRecords = async () => {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    const { data } = await supabase
      .from('commission_records')
      .select('*, barbers(name)')
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false });

    if (data) setCommissionRecords(data);
  };

  /**
   * Atualiza percentual de comissão de um barbeiro
   * @param barberId - ID do barbeiro
   */
  const updateBarberCommission = async (barberId: string) => {
    const percentage = parseFloat(commissionPercentage);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      Alert.alert('Erro', 'Percentual inválido (0-100)');
      return;
    }

    logger.info(`Atualizando comissão do barbeiro ${barberId}: ${percentage}%`);

    // Verificar se já existe configuração
    const existing = barberCommissions.find(c => c.barber_id === barberId);

    if (existing) {
      const { error } = await supabase
        .from('barber_commissions')
        .update({ commission_percentage: percentage })
        .eq('id', existing.id);

      if (!error) {
        setEditingCommission(null);
        fetchBarberCommissions();
        Alert.alert('Sucesso', 'Comissão atualizada!');
      }
    } else {
      const { error } = await supabase
        .from('barber_commissions')
        .insert({ barber_id: barberId, commission_percentage: percentage });

      if (!error) {
        setEditingCommission(null);
        fetchBarberCommissions();
        Alert.alert('Sucesso', 'Comissão configurada!');
      }
    }
  };

  /**
   * Marca comissões como pagas para um barbeiro
   * @param barberId - ID do barbeiro
   */
  const markCommissionsAsPaid = async (barberId: string) => {
    const pending = commissionRecords.filter(r => r.barber_id === barberId && r.status === 'pending');
    if (pending.length === 0) {
      Alert.alert('Aviso', 'Não há comissões pendentes para este barbeiro');
      return;
    }

    const total = pending.reduce((sum, r) => sum + r.commission_amount, 0);

    Alert.alert(
      'Confirmar Pagamento',
      `Deseja marcar R$ ${total.toFixed(2)} como pago para este barbeiro?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            const ids = pending.map(r => r.id);
            await supabase
              .from('commission_records')
              .update({ status: 'paid', paid_at: new Date().toISOString() })
              .in('id', ids);

            fetchCommissionRecords();
            Alert.alert('Sucesso', 'Comissões marcadas como pagas!');
          }
        }
      ]
    );
  };

  // =============================================
  // FUNÇÕES DE CONTROLE DE CAIXA
  // =============================================

  /**
   * Busca o caixa aberto do dia atual
   */
  const fetchCurrentCashRegister = async () => {
    setLoadingCash(true);
    logger.info('Buscando caixa atual...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: register } = await supabase
      .from('cash_register')
      .select('*')
      .eq('status', 'open')
      .gte('open_date', today.toISOString())
      .single();

    if (register) {
      setCurrentCashRegister(register);
      fetchCashMovements(register.id);
    } else {
      setCurrentCashRegister(null);
      setCashMovements([]);
    }
    setLoadingCash(false);
  };

  /**
   * Busca movimentações de um caixa
   * @param registerId - ID do caixa
   */
  const fetchCashMovements = async (registerId: string) => {
    const { data } = await supabase
      .from('cash_movements')
      .select('*')
      .eq('cash_register_id', registerId)
      .order('created_at', { ascending: false });

    if (data) setCashMovements(data);
  };

  /**
   * Abre um novo caixa com saldo inicial
   */
  const openCashRegister = async () => {
    const balance = parseFloat(openingBalance) || 0;

    logger.info(`Abrindo caixa com saldo inicial: R$ ${balance}`);

    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('cash_register')
      .insert({
        opened_by: user.user?.id,
        opening_balance: balance,
        expected_balance: balance,
        status: 'open'
      })
      .select()
      .single();

    if (error) {
      logger.data.insert('cash_register', false, error);
      Alert.alert('Erro', 'Não foi possível abrir o caixa');
    } else {
      logger.data.insert('cash_register', true);
      setCurrentCashRegister(data);
      setOpeningBalance('');
      Alert.alert('Sucesso', 'Caixa aberto com sucesso!');
    }
  };

  /**
   * Fecha o caixa atual
   */
  const closeCashRegister = async () => {
    if (!currentCashRegister) return;

    const balance = parseFloat(closingBalance) || 0;
    const expected = currentCashRegister.expected_balance;
    const difference = balance - expected;

    Alert.alert(
      'Confirmar Fechamento',
      `Saldo informado: R$ ${balance.toFixed(2)}\nSaldo esperado: R$ ${expected.toFixed(2)}\nDiferença: R$ ${difference.toFixed(2)}`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Fechar Caixa',
          onPress: async () => {
            const { data: user } = await supabase.auth.getUser();

            await supabase
              .from('cash_register')
              .update({
                closed_by: user.user?.id,
                close_date: new Date().toISOString(),
                closing_balance: balance,
                difference: difference,
                status: 'closed'
              })
              .eq('id', currentCashRegister.id);

            setCurrentCashRegister(null);
            setClosingBalance('');
            setCashMovements([]);
            Alert.alert('Sucesso', 'Caixa fechado!');
          }
        }
      ]
    );
  };

  /**
   * Adiciona movimentação ao caixa (entrada ou saída)
   */
  const addCashMovement = async () => {
    if (!currentCashRegister) {
      Alert.alert('Erro', 'Abra o caixa primeiro');
      return;
    }
    if (!cashMovementAmount || !cashMovementDesc) {
      Alert.alert('Erro', 'Preencha descrição e valor');
      return;
    }

    const amount = parseFloat(cashMovementAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Erro', 'Valor inválido');
      return;
    }

    const { data: user } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('cash_movements')
      .insert({
        cash_register_id: currentCashRegister.id,
        type: cashMovementType,
        description: cashMovementDesc,
        amount: amount,
        created_by: user.user?.id
      });

    if (error) {
      logger.data.insert('cash_movements', false, error);
      Alert.alert('Erro', 'Não foi possível adicionar a movimentação');
    } else {
      // Atualizar saldo esperado no caixa
      const newExpected = cashMovementType === 'income'
        ? currentCashRegister.expected_balance + amount
        : currentCashRegister.expected_balance - amount;

      const newRevenue = cashMovementType === 'income'
        ? currentCashRegister.total_revenue + amount
        : currentCashRegister.total_revenue;

      const newExpense = cashMovementType === 'expense'
        ? currentCashRegister.total_expenses + amount
        : currentCashRegister.total_expenses;

      await supabase
        .from('cash_register')
        .update({
          expected_balance: newExpected,
          total_revenue: newRevenue,
          total_expenses: newExpense
        })
        .eq('id', currentCashRegister.id);

      setShowAddMovement(false);
      setCashMovementDesc('');
      setCashMovementAmount('');
      fetchCurrentCashRegister();
      Alert.alert('Sucesso', 'Movimentação registrada!');
    }
  };

  // =============================================
  // FUNÇÕES DE AVALIAÇÕES
  // =============================================

  /**
   * Busca todas as avaliações e calcula média por barbeiro
   */
  const fetchReviews = async () => {
    setLoadingReviews(true);
    logger.info('Buscando avaliações...');

    const { data, error } = await supabase
      .from('reviews')
      .select('*, barbers(name), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) {
      logger.data.fetch('reviews', null, error);
    } else if (data) {
      logger.data.fetch('reviews', data.length);
      setReviews(data);

      // Calcular média por barbeiro
      const ratings: Record<string, { total: number; count: number }> = {};
      data.forEach(r => {
        if (!ratings[r.barber_id]) {
          ratings[r.barber_id] = { total: 0, count: 0 };
        }
        ratings[r.barber_id].total += r.rating;
        ratings[r.barber_id].count++;
      });

      const avgs: Record<string, { avg: number; count: number }> = {};
      Object.entries(ratings).forEach(([id, val]) => {
        avgs[id] = { avg: val.total / val.count, count: val.count };
      });
      setBarberRatings(avgs);
    }
    setLoadingReviews(false);
  };

  // =============================================
  // FUNÇÕES DE NOTIFICAÇÕES INTERNAS
  // =============================================

  /**
   * Busca notificações não lidas
   */
  const fetchNotifications = async () => {
    setLoadingNotifications(true);

    const { data } = await supabase
      .from('internal_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoadingNotifications(false);
  };

  /**
   * Marca notificação como lida
   * @param id - ID da notificação
   */
  const markNotificationAsRead = async (id: string) => {
    await supabase
      .from('internal_notifications')
      .update({ is_read: true })
      .eq('id', id);

    fetchNotifications();
  };

  /**
   * Marca todas como lidas
   */
  const markAllNotificationsAsRead = async () => {
    await supabase
      .from('internal_notifications')
      .update({ is_read: true })
      .eq('is_read', false);

    fetchNotifications();
    Alert.alert('Sucesso', 'Todas as notificações foram marcadas como lidas');
  };

  /**
   * Cria uma notificação interna
   */
  const createNotification = async (type: string, title: string, message: string, data?: any) => {
    await supabase
      .from('internal_notifications')
      .insert({
        type,
        title,
        message,
        data,
        target_role: 'barber'
      });
  };

  // =============================================
  // FUNÇÕES DE METAS POR BARBEIRO
  // =============================================

  /**
   * Busca metas do mês atual para todos os barbeiros
   */
  const fetchBarberGoals = async () => {
    setLoadingGoals(true);
    logger.info('Buscando metas dos barbeiros...');

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Buscar metas configuradas
    const { data: goals } = await supabase
      .from('barber_goals')
      .select('*, barbers(name)')
      .eq('month', monthStart);

    // Buscar dados reais do mês
    const { data: appointments } = await supabase
      .from('appointments')
      .select('barber_id, services(price)')
      .gte('appointment_date', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
      .eq('status', 'confirmed');

    // Calcular progresso real
    const progress: Record<string, { appointments: number; revenue: number }> = {};
    appointments?.forEach(a => {
      if (!progress[a.barber_id]) {
        progress[a.barber_id] = { appointments: 0, revenue: 0 };
      }
      progress[a.barber_id].appointments++;
      const svc = Array.isArray(a.services) ? a.services[0] : a.services;
      progress[a.barber_id].revenue += svc?.price || 0;
    });

    // Atualizar progresso no banco
    if (goals) {
      for (const goal of goals) {
        const prog = progress[goal.barber_id] || { appointments: 0, revenue: 0 };
        await supabase
          .from('barber_goals')
          .update({
            current_appointments: prog.appointments,
            current_revenue: prog.revenue
          })
          .eq('id', goal.id);
      }
    }

    // Recarregar metas atualizadas
    const { data: updatedGoals } = await supabase
      .from('barber_goals')
      .select('*, barbers(name)')
      .eq('month', monthStart);

    if (updatedGoals) {
      setBarberGoals(updatedGoals);
    }
    setLoadingGoals(false);
  };

  /**
   * Salva ou atualiza meta de um barbeiro
   * @param barberId - ID do barbeiro
   */
  const saveBarberGoal = async (barberId: string) => {
    const appointments = parseInt(goalAppointments) || 0;
    const revenue = parseFloat(goalRevenue) || 0;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    const existing = barberGoals.find(g => g.barber_id === barberId);

    if (existing) {
      await supabase
        .from('barber_goals')
        .update({
          target_appointments: appointments,
          target_revenue: revenue
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('barber_goals')
        .insert({
          barber_id: barberId,
          month: monthStart,
          target_appointments: appointments,
          target_revenue: revenue
        });
    }

    setEditingGoal(null);
    setGoalAppointments('');
    setGoalRevenue('');
    fetchBarberGoals();
    Alert.alert('Sucesso', 'Meta salva!');
  };

  // =============================================
  // FUNÇÕES DE LISTA DE ESPERA
  // =============================================

  /**
   * Busca clientes na lista de espera
   */
  const fetchWaitingList = async () => {
    setLoadingWaitingList(true);
    logger.info('Buscando lista de espera...');

    const { data, error } = await supabase
      .from('waiting_list')
      .select('*, barbers(name), services(name)')
      .eq('status', 'waiting')
      .order('created_at', { ascending: true });

    if (error) {
      logger.data.fetch('waiting_list', null, error);
    } else if (data) {
      logger.data.fetch('waiting_list', data.length);
      setWaitingList(data);
    }
    setLoadingWaitingList(false);
  };

  /**
   * Adiciona cliente à lista de espera
   */
  const addToWaitingList = async () => {
    if (!waitingClientName || !waitingDate) {
      Alert.alert('Erro', 'Preencha nome e data desejada');
      return;
    }

    const { error } = await supabase
      .from('waiting_list')
      .insert({
        client_name: waitingClientName,
        client_phone: waitingClientPhone,
        barber_id: waitingBarber?.id,
        service_id: waitingService?.id,
        preferred_date: waitingDate,
        preferred_time_start: waitingTimeStart || null,
        preferred_time_end: waitingTimeEnd || null
      });

    if (error) {
      logger.data.insert('waiting_list', false, error);
      Alert.alert('Erro', 'Não foi possível adicionar à lista');
    } else {
      setShowAddWaiting(false);
      resetWaitingForm();
      fetchWaitingList();
      createNotification('general', 'Lista de Espera', `${waitingClientName} foi adicionado à lista de espera`);
      Alert.alert('Sucesso', 'Cliente adicionado à lista de espera!');
    }
  };

  /**
   * Remove cliente da lista de espera
   */
  const removeFromWaitingList = async (id: string, name: string) => {
    Alert.alert(
      'Remover da Lista',
      `Remover ${name} da lista de espera?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            await supabase
              .from('waiting_list')
              .update({ status: 'cancelled' })
              .eq('id', id);
            fetchWaitingList();
          }
        }
      ]
    );
  };

  /**
   * Notifica cliente que horário ficou disponível
   */
  const notifyWaitingClient = async (id: string, name: string, phone?: string) => {
    Alert.alert(
      'Notificar Cliente',
      `Notificar ${name} que um horário ficou disponível?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Notificar',
          onPress: async () => {
            await supabase
              .from('waiting_list')
              .update({ status: 'notified', notified_at: new Date().toISOString() })
              .eq('id', id);

            fetchWaitingList();

            if (phone) {
              // Abrir WhatsApp para notificar
              const cleanPhone = phone.replace(/\D/g, '');
              Linking.openURL(`whatsapp://send?phone=55${cleanPhone}&text=Olá ${name}! Um horário ficou disponível na barbearia. Deseja agendar?`);
            }

            Alert.alert('Sucesso', 'Cliente notificado!');
          }
        }
      ]
    );
  };

  /**
   * Reseta formulário de lista de espera
   */
  const resetWaitingForm = () => {
    setWaitingClientName('');
    setWaitingClientPhone('');
    setWaitingBarber(null);
    setWaitingService(null);
    setWaitingDate('');
    setWaitingTimeStart('');
    setWaitingTimeEnd('');
  };

  // =============================================
  // FUNÇÕES DE INDICAÇÕES
  // =============================================

  /**
   * Busca todas as indicações
   */
  const fetchReferrals = async () => {
    setLoadingReferrals(true);
    logger.info('Buscando indicações...');

    const { data } = await supabase
      .from('referrals')
      .select('*, profiles:referrer_id(full_name, phone)')
      .order('created_at', { ascending: false });

    if (data) setReferrals(data);
    setLoadingReferrals(false);
  };

  /**
   * Adiciona nova indicação
   */
  const addReferral = async () => {
    if (!referralName) {
      Alert.alert('Erro', 'Preencha o nome do indicado');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('referrals')
      .insert({
        referrer_id: user?.id,
        referred_name: referralName,
        referred_phone: referralPhone
      });

    if (!error) {
      setShowAddReferral(false);
      setReferralName('');
      setReferralPhone('');
      fetchReferrals();
      Alert.alert('Sucesso', 'Indicação registrada!');
    }
  };

  /**
   * Marca indicação como completada
   */
  const completeReferral = async (id: string) => {
    await supabase
      .from('referrals')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', id);
    fetchReferrals();
    Alert.alert('Sucesso', 'Indicação marcada como completada!');
  };

  // =============================================
  // FUNÇÕES DE ESTOQUE
  // =============================================

  /**
   * Busca todos os produtos
   */
  const fetchProducts = async () => {
    setLoadingProducts(true);
    logger.info('Buscando produtos...');

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (data) setProducts(data);
    setLoadingProducts(false);
  };

  /**
   * Salva produto (novo ou edição)
   */
  const saveProduct = async () => {
    if (!productName) {
      Alert.alert('Erro', 'Preencha o nome do produto');
      return;
    }

    const productData = {
      name: productName,
      category: productCategory,
      cost_price: parseFloat(productCostPrice) || 0,
      sale_price: parseFloat(productSalePrice) || 0,
      stock_quantity: parseInt(productStock) || 0,
      min_stock: parseInt(productMinStock) || 5
    };

    if (editingProduct) {
      await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id);
    } else {
      await supabase
        .from('products')
        .insert(productData);
    }

    setShowAddProduct(false);
    setEditingProduct(null);
    resetProductForm();
    fetchProducts();
    Alert.alert('Sucesso', editingProduct ? 'Produto atualizado!' : 'Produto cadastrado!');
  };

  /**
   * Reseta formulário de produto
   */
  const resetProductForm = () => {
    setProductName('');
    setProductCategory('');
    setProductCostPrice('');
    setProductSalePrice('');
    setProductStock('');
    setProductMinStock('5');
  };

  /**
   * Inicia edição de produto
   */
  const startEditProduct = (product: any) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductCategory(product.category || '');
    setProductCostPrice(product.cost_price?.toString() || '');
    setProductSalePrice(product.sale_price?.toString() || '');
    setProductStock(product.stock_quantity?.toString() || '');
    setProductMinStock(product.min_stock?.toString() || '5');
    setShowAddProduct(true);
  };

  /**
   * Deleta produto
   */
  const deleteProduct = async (id: string) => {
    Alert.alert('Confirmar', 'Deseja excluir este produto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('products').update({ is_active: false }).eq('id', id);
          fetchProducts();
        }
      }
    ]);
  };

  /**
   * Registra movimentação de estoque
   */
  const registerStockMovement = async (productId: string) => {
    const qty = parseInt(stockMovementQty);
    if (!qty || qty <= 0) {
      Alert.alert('Erro', 'Quantidade inválida');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();

    // Registrar movimentação
    await supabase
      .from('stock_movements')
      .insert({
        product_id: productId,
        type: stockMovementType,
        quantity: stockMovementType === 'exit' || stockMovementType === 'sale' ? -qty : qty,
        reason: stockMovementReason || (stockMovementType === 'entry' ? 'Entrada' : stockMovementType === 'sale' ? 'Venda' : 'Saída'),
        created_by: user?.id
      });

    // Atualizar quantidade no produto
    const product = products.find(p => p.id === productId);
    if (product) {
      const newQty = stockMovementType === 'entry' 
        ? product.stock_quantity + qty 
        : product.stock_quantity - qty;
      
      await supabase
        .from('products')
        .update({ stock_quantity: Math.max(0, newQty) })
        .eq('id', productId);
    }

    setShowStockMovement(null);
    setStockMovementQty('');
    setStockMovementReason('');
    fetchProducts();
    Alert.alert('Sucesso', 'Movimentação registrada!');
  };

  // =============================================
  // FUNÇÕES DE FIDELIDADE
  // =============================================

  /**
   * Busca recompensas de fidelidade
   */
  const fetchLoyaltyRewards = async () => {
    setLoadingLoyalty(true);

    const { data } = await supabase
      .from('loyalty_rewards')
      .select('*')
      .eq('is_active', true)
      .order('points_cost', { ascending: true });

    if (data) setLoyaltyRewards(data);

    // Buscar top clientes com mais pontos
    const { data: topClients } = await supabase
      .from('loyalty_points')
      .select('*, profiles(full_name)')
      .order('points', { ascending: false })
      .limit(10);

    if (topClients) setTopLoyaltyClients(topClients);

    setLoadingLoyalty(false);
  };

  /**
   * Adiciona recompensa de fidelidade
   */
  const addLoyaltyReward = async () => {
    if (!rewardName || !rewardPointsCost) {
      Alert.alert('Erro', 'Preencha nome e custo em pontos');
      return;
    }

    await supabase
      .from('loyalty_rewards')
      .insert({
        name: rewardName,
        description: rewardDescription,
        points_cost: parseInt(rewardPointsCost)
      });

    setShowAddReward(false);
    setRewardName('');
    setRewardDescription('');
    setRewardPointsCost('');
    fetchLoyaltyRewards();
    Alert.alert('Sucesso', 'Recompensa cadastrada!');
  };

  /**
   * Deleta recompensa
   */
  const deleteLoyaltyReward = async (id: string) => {
    await supabase
      .from('loyalty_rewards')
      .update({ is_active: false })
      .eq('id', id);
    fetchLoyaltyRewards();
  };

  // =============================================
  // FUNÇÕES DE LINK ONLINE
  // =============================================

  /**
   * Busca configuração do agendamento online
   */
  const fetchOnlineConfig = async () => {
    setLoadingOnlineConfig(true);

    const { data } = await supabase
      .from('online_booking_config')
      .select('*')
      .single();

    if (data) {
      setOnlineConfig(data);
      setOnlineSalonName(data.salon_name || '');
      setOnlineSalonPhone(data.salon_phone || '');
      setOnlineSalonAddress(data.salon_address || '');
      setOnlineEnabled(data.booking_enabled);
    }
    setLoadingOnlineConfig(false);
  };

  /**
   * Salva configuração do agendamento online
   */
  const saveOnlineConfig = async () => {
    if (onlineConfig) {
      await supabase
        .from('online_booking_config')
        .update({
          salon_name: onlineSalonName,
          salon_phone: onlineSalonPhone,
          salon_address: onlineSalonAddress,
          booking_enabled: onlineEnabled
        })
        .eq('id', onlineConfig.id);
    } else {
      await supabase
        .from('online_booking_config')
        .insert({
          salon_name: onlineSalonName,
          salon_phone: onlineSalonPhone,
          salon_address: onlineSalonAddress,
          booking_enabled: onlineEnabled
        });
    }

    fetchOnlineConfig();
    Alert.alert('Sucesso', 'Configuração salva!');
  };

  /**
   * Copia link de agendamento para clipboard
   */
  const copyBookingLink = () => {
    const link = `https://barbershop-app.com/book`;
    // Em produção, usar Clipboard do Expo
    Alert.alert('Link Copiado!', `Compartilhe este link:\n${link}`);
  };

  const fetchFinanceData = async () => {
    setLoadingFinance(true);
    const { start, end } = getDateRange(financeFilter);
    
    // Buscar agendamentos para PREVISÃO (todos não cancelados)
    const { data: allAppointments } = await supabase
      .from('appointments')
      .select('id, appointment_date, client_name, status, services(name, price)')
      .gte('appointment_date', start)
      .lt('appointment_date', end)
      .neq('status', 'cancelled')
      .order('appointment_date', { ascending: false });

    // Buscar agendamentos para REALIZADO (apenas concluídos)
    const { data: completedAppointments } = await supabase
      .from('appointments')
      .select('id, appointment_date, client_name, status, services(name, price)')
      .gte('appointment_date', start)
      .lt('appointment_date', end)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false });
    
    // Processar PREVISÃO
    let previsaoReceitas = 0;
    const previsaoTransacoes = allAppointments?.map((a) => {
      const svc = Array.isArray(a.services) ? a.services[0] : a.services;
      const preco = svc?.price || 0;
      previsaoReceitas += preco;
      return {
        id: a.id,
        date: a.appointment_date,
        client: a.client_name,
        service: svc?.name || 'Serviço',
        valor: preco,
        tipo: 'receita',
        status: a.status
      };
    }) || [];

    // Processar REALIZADO
    let realizadoReceitas = 0;
    const realizadoTransacoes = completedAppointments?.map((a) => {
      const svc = Array.isArray(a.services) ? a.services[0] : a.services;
      const preco = svc?.price || 0;
      realizadoReceitas += preco;
      return {
        id: a.id,
        date: a.appointment_date,
        client: a.client_name,
        service: svc?.name || 'Serviço',
        valor: preco,
        tipo: 'receita',
        status: a.status
      };
    }) || [];

    // Buscar despesas das movimentações de caixa
    const { data: expensesData } = await supabase
      .from('cash_movements')
      .select('id, created_at, description, amount, type')
      .eq('type', 'expense')
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false });

    let totalDespesas = 0;
    const despesasTransacoes = expensesData?.map((e) => {
      totalDespesas += e.amount || 0;
      return {
        id: e.id,
        date: e.created_at,
        client: '-',
        service: e.description || 'Despesa',
        valor: e.amount || 0,
        tipo: 'despesa'
      };
    }) || [];

    // Combinar transações para PREVISÃO
    const previsaoTodas = [...previsaoTransacoes, ...despesasTransacoes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Combinar transações para REALIZADO
    const realizadoTodas = [...realizadoTransacoes, ...despesasTransacoes]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setFinanceData({
      receitas: previsaoReceitas,
      despesas: totalDespesas,
      transacoes: previsaoTodas
    });

    setFinanceRealData({
      receitas: realizadoReceitas,
      despesas: totalDespesas,
      transacoes: realizadoTodas
    });

    setLoadingFinance(false);
  };

  // Carregar permissões quando o componente monta
  useEffect(() => {
    console.log('[ADMIN] useEffect de permissões disparado');
    
    async function init() {
      console.log('[ADMIN] Iniciando carregamento de permissões...');
      setLoadingPermissions(true);
      
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('[ADMIN] Erro ao buscar usuário:', userError);
        }
        
        if (!user) {
          console.log('[ADMIN] Usuário não autenticado');
          setUserRole('admin'); // Fallback
          setLoadingPermissions(false);
          return;
        }

        console.log('[ADMIN] User ID:', user.id);
        console.log('[ADMIN] Email:', user.email);

        // Buscar role do usuário
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('[ADMIN] Erro ao buscar perfil:', profileError);
        }

        console.log('[ADMIN] Perfil encontrado:', JSON.stringify(profile));

        if (profile) {
          const role = profile.role || 'admin';
          setUserRole(role);
          console.log('[ADMIN] Role definido como:', role);
          
          // Configurar permissões baseadas no role
          if (role === 'admin') {
            console.log('[ADMIN] ✅✅✅ USUÁRIO É ADMIN - ACESSO TOTAL ✅✅✅');
            setPermissions({
              can_view_dashboard: true,
              can_view_agenda: true,
              can_edit_appointments: true,
              can_view_clients: true,
              can_edit_clients: true,
              can_view_services: true,
              can_edit_services: true,
              can_view_team: true,
              can_edit_team: true,
              can_view_finance: true,
              can_view_commissions: true,
              can_view_cash_register: true,
              can_view_subscriptions: true,
              can_view_reports: true,
              can_view_settings: true,
              can_manage_barbers: true,
            });
          } else if (role === 'barber') {
            console.log('[ADMIN] Usuário é BARBEIRO - acesso limitado');
            setPermissions({
              can_view_dashboard: true,
              can_view_agenda: true,
              can_edit_appointments: true,
              can_view_clients: true,
              can_edit_clients: false,
              can_view_services: false,
              can_edit_services: false,
              can_view_team: false,
              can_edit_team: false,
              can_view_finance: false,
              can_view_commissions: false,
              can_view_cash_register: false,
              can_view_subscriptions: false,
              can_view_reports: false,
              can_view_settings: false,
              can_manage_barbers: false,
            });
            setActiveTab('agenda');
          } else {
            console.log('[ADMIN] Usuário é CLIENTE');
          }
        } else {
          console.log('[ADMIN] Perfil não encontrado, usando admin como fallback');
          setUserRole('admin');
          setPermissions({
            can_view_dashboard: true,
            can_view_agenda: true,
            can_edit_appointments: true,
            can_view_clients: true,
            can_edit_clients: true,
            can_view_services: true,
            can_edit_services: true,
            can_view_team: true,
            can_edit_team: true,
            can_view_finance: true,
            can_view_commissions: true,
            can_view_cash_register: true,
            can_view_subscriptions: true,
            can_view_reports: true,
            can_view_settings: true,
            can_manage_barbers: true,
          });
        }
      } catch (e) {
        console.error('[ADMIN] ERRO CRÍTICO:', e);
        setUserRole('admin');
        setPermissions({
          can_view_dashboard: true,
          can_view_agenda: true,
          can_edit_appointments: true,
          can_view_clients: true,
          can_edit_clients: true,
          can_view_services: true,
          can_edit_services: true,
          can_view_team: true,
          can_edit_team: true,
          can_view_finance: true,
          can_view_commissions: true,
          can_view_cash_register: true,
          can_view_subscriptions: true,
          can_view_reports: true,
          can_view_settings: true,
          can_manage_barbers: true,
        });
      }
      
      console.log('[ADMIN] ========== CARREGAMENTO FINALIZADO ==========');
      setLoadingPermissions(false);
    }
    
    init();
  }, []);

  // Carregar dados quando a aba muda
  useEffect(() => {
    if (loadingPermissions) return;
    
    logger.info(`Aba selecionada: ${activeTab} | Role: ${userRole}`);
    
    // Carregar dados baseados na aba selecionada e permissões
    if (activeTab === 'dashboard' && hasPermission('can_view_dashboard')) { 
      fetchDashboardData(); 
      fetchNotifications(); 
    }
    if (activeTab === 'agenda' && hasPermission('can_view_agenda')) { 
      fetchAppointments(); 
      fetchScheduleBlocks(); 
      fetchWaitingList(); 
    }
    if (activeTab === 'servicos' && hasPermission('can_view_services')) fetchServices();
    if (activeTab === 'profissionais' && hasPermission('can_view_team')) { 
      fetchBarbers(); 
      fetchBarberCommissions(); 
      fetchBarberGoals(); 
      fetchReviews();
      fetchBarberAccounts(); 
    }
    if (activeTab === 'clientes' && hasPermission('can_view_clients')) fetchClientHistory();
    if (activeTab === 'financeiro' && hasPermission('can_view_finance')) fetchFinanceData();
    if (activeTab === 'mensalistas' && hasPermission('can_view_subscriptions')) { 
      fetchSubscriptions(); 
      fetchSubscriptionClients(); 
    }
    if (activeTab === 'caixa' && hasPermission('can_view_cash_register')) { 
      fetchCurrentCashRegister(); 
      fetchCommissionRecords(); 
    }
    if (activeTab === 'mais' && hasPermission('can_view_settings')) {
      fetchReferrals();
      fetchProducts();
      fetchLoyaltyRewards();
      fetchOnlineConfig();
    }
  }, [activeTab, userRole, loadingPermissions]);

  // Recarregar dados financeiros quando o filtro mudar
  useEffect(() => {
    if (activeTab === 'financeiro' && !loadingPermissions && hasPermission('can_view_finance')) {
      fetchFinanceData();
    }
  }, [financeFilter]);

  const startEditService = (service: any) => {
     setIsEditing(true);
     if(service) {
        setEditId(service.id);
        setFormName(service.name);
        setFormPrice(service.price.toString());
        setFormDuration(service.duration_minutes.toString());
     } else {
        setEditId(null);
        setFormName('');
        setFormPrice('');
        setFormDuration('30');
     }
  };

  const startEditBarber = (b: any) => {
     setIsEditing(true);
     if(b) {
        setEditId(b.id);
        setFormBarberName(b.name);
        setFormBarberSpecialty(b.specialty || '');
     } else {
        setEditId(null);
        setFormBarberName('');
        setFormBarberSpecialty('');
     }
  };

  const saveService = async () => {
     if(!formName || !formPrice || !formDuration) return Alert.alert('Erro', 'Preencha todos os campos!');
     setLoadingServices(true);
     const payload = {
        name: formName,
        price: parseFloat(formPrice.replace(',', '.')),
        duration_minutes: parseInt(formDuration),
        icon: 'cut'
     };

     if(editId) {
        const {error} = await supabase.from('services').update(payload).eq('id', editId);
        if(error) Alert.alert('Erro', error.message);
     } else {
        const {error} = await supabase.from('services').insert(payload);
        if(error) Alert.alert('Erro', error.message);
     }
     setIsEditing(false);
     fetchServices();
  };

  const saveBarber = async () => {
     if(!formBarberName) return Alert.alert('Erro', 'Preencha o nome do profissional!');
     setLoadingBarbers(true);
     const payload = {
        name: formBarberName,
        specialty: formBarberSpecialty,
        avatar_url: 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)
     };

     if(editId) {
        const {error} = await supabase.from('barbers').update(payload).eq('id', editId);
        if(error) Alert.alert('Erro', error.message);
     } else {
        const {error} = await supabase.from('barbers').insert(payload);
        if(error) Alert.alert('Erro', error.message);
     }
     setIsEditing(false);
     fetchBarbers();
  };

  // =============================================
  // FUNÇÕES PARA GERENCIAR COLABORADORES
  // =============================================

  /**
   * Busca contas de colaboradores vinculadas a barbeiros
   */
  const fetchBarberAccounts = async () => {
    setLoadingAccounts(true);
    console.log('[COLABORADORES] Buscando contas...');

    const { data } = await supabase
      .from('barber_accounts')
      .select('*, barbers(id, name, avatar_url)')
      .order('created_at', { ascending: false });

    if (data) {
      console.log(`[COLABORADORES] ${data.length} contas encontradas`);
      setBarberAccounts(data);
    }
    setLoadingAccounts(false);
  };

  /**
   * Cria conta de login para um barbeiro
   */
  const createBarberAccount = async () => {
    if (!selectedBarberForAccount) {
      Alert.alert('Erro', 'Selecione um profissional');
      return;
    }
    if (!accountEmail || !accountPassword) {
      Alert.alert('Erro', 'Preencha email e senha');
      return;
    }
    if (accountPassword.length < 6) {
      Alert.alert('Erro', 'Senha deve ter pelo menos 6 caracteres');
      return;
    }

    console.log('[COLABORADORES] Criando conta para:', selectedBarberForAccount.name);

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: accountEmail,
        password: accountPassword,
      });

      if (authError) {
        Alert.alert('Erro', authError.message);
        return;
      }

      if (authData.user) {
        // Criar perfil com role barber
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          full_name: selectedBarberForAccount.name,
          role: 'barber',
        });

        // Salvar conta vinculada ao barbeiro
        const { error: accountError } = await supabase
          .from('barber_accounts')
          .insert({
            barber_id: selectedBarberForAccount.id,
            email: accountEmail,
            permissions: accountPermissions,
            is_active: true,
          });

        if (accountError) {
          console.error('[COLABORADORES] Erro ao criar conta:', accountError);
          Alert.alert('Erro', 'Não foi possível criar a conta');
        } else {
          console.log('[COLABORADORES] ✅ Conta criada com sucesso');
          setShowAddAccount(false);
          resetAccountForm();
          fetchBarberAccounts();
          Alert.alert('Sucesso', `Conta criada para ${selectedBarberForAccount.name}!\n\nEmail: ${accountEmail}\nSenha: ${accountPassword}\n\nCompartilhe essas credenciais com o colaborador.`);
        }
      }
    } catch (e) {
      console.error('[COLABORADORES] Erro:', e);
      Alert.alert('Erro', 'Não foi possível criar a conta');
    }
  };

  /**
   * Atualiza permissões de uma conta
   */
  const updateAccountPermissions = async (accountId: string) => {
    console.log('[COLABORADORES] Atualizando permissões da conta:', accountId);

    const { error } = await supabase
      .from('barber_accounts')
      .update({ permissions: accountPermissions })
      .eq('id', accountId);

    if (!error) {
      setEditingAccountId(null);
      fetchBarberAccounts();
      Alert.alert('Sucesso', 'Permissões atualizadas!');
    }
  };

  /**
   * Altera senha de um colaborador
   */
  const changeBarberPassword = async (email: string) => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Erro', 'Senha deve ter pelo menos 6 caracteres');
      return;
    }

    console.log('[COLABORADORES] Alterando senha para:', email);

    // Nota: Para alterar senha de outro usuário, precisamos usar Admin API
    // Por enquanto, vamos apenas registrar a nova senha
    Alert.alert(
      'Instruções para o Colaborador',
      `Peça para o colaborador acessar:\n\n1. Tela de Login\n2. Clicar em "Esqueci minha senha"\n3. Inserir o email: ${email}\n4. Seguir as instruções do email\n\nOu informe a nova senha diretamente:\n${newPassword}`
    );

    setShowChangePassword(null);
    setNewPassword('');
  };

  /**
   * Ativa/Desativa conta de colaborador
   */
  const toggleAccountStatus = async (accountId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    Alert.alert(
      newStatus ? 'Ativar Conta' : 'Desativar Conta',
      newStatus ? 'Deseja ativar esta conta?' : 'Deseja desativar esta conta? O colaborador não poderá fazer login.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            await supabase
              .from('barber_accounts')
              .update({ is_active: newStatus })
              .eq('id', accountId);
            
            fetchBarberAccounts();
            Alert.alert('Sucesso', newStatus ? 'Conta ativada!' : 'Conta desativada!');
          }
        }
      ]
    );
  };

  /**
   * Reseta formulário de conta
   */
  const resetAccountForm = () => {
    setSelectedBarberForAccount(null);
    setAccountEmail('');
    setAccountPassword('');
    setAccountPermissions({
      can_view_dashboard: true,
      can_view_agenda: true,
      can_edit_appointments: true,
      can_view_clients: true,
      can_edit_clients: false,
      can_view_services: false,
      can_edit_services: false,
      can_view_team: false,
      can_edit_team: false,
      can_view_finance: false,
      can_view_commissions: false,
      can_view_cash_register: false,
      can_view_subscriptions: false,
      can_view_settings: false,
      can_manage_barbers: false,
    });
  };

  const deleteService = async (id: string) => {
     Alert.alert("Confirmar", "Excluir este serviço da tabela?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: async () => {
            setLoadingServices(true);
            await supabase.from('services').delete().eq('id', id);
            fetchServices();
        }}
     ]);
  };

  const deleteBarber = async (id: string) => {
     Alert.alert("Confirmar", "Excluir este profissional da equipe?", [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: async () => {
            setLoadingBarbers(true);
            await supabase.from('barbers').delete().eq('id', id);
            fetchBarbers();
        }}
     ]);
  };

  // Loading state enquanto carrega permissões
  if (loadingPermissions) {
    return (
      <SafeAreaView className="flex-1 bg-[#121212] items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#d4af37" />
        <Text className="text-gray-400 mt-4">Carregando painel...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
        <View className="px-4 pt-4 mb-4">
          {/* Header com Role */}
          <View className="flex-row justify-between items-center">
            <Text className="text-[#d4af37] text-2xl font-bold">Painel Gerencial</Text>
            <View className={`px-3 py-1 rounded-full ${userRole === 'admin' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-700'}`}>
              <Text className={`text-xs font-bold ${userRole === 'admin' ? 'text-black' : 'text-gray-400'}`}>
                {userRole === 'admin' ? '👑 Admin' : '✂️ Barbeiro'}
              </Text>
            </View>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingTop: 16, paddingRight: 16 }}
            className="mt-2"
          >
            {/* Dashboard - Admin apenas */}
            {hasPermission('can_view_dashboard') && (
              <TouchableOpacity 
                onPress={() => {setIsEditing(false); setActiveTab('dashboard');}} 
                className={`px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] ${activeTab === 'dashboard' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-[#d4af37]'}`}
              >
                <Ionicons name="stats-chart" size={20} color={activeTab === 'dashboard' ? '#000' : '#d4af37'} />
                <Text className={`font-bold text-xs mt-1 ${activeTab === 'dashboard' ? 'text-black' : 'text-[#d4af37]'}`}>Dashboard</Text>
              </TouchableOpacity>
            )}

            {/* Agenda - Todos */}
            {hasPermission('can_view_agenda') && (
              <TouchableOpacity 
                onPress={() => {setIsEditing(false); setActiveTab('agenda');}} 
                className={`px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] ${activeTab === 'agenda' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-[#d4af37]'}`}
              >
                <Ionicons name="calendar" size={20} color={activeTab === 'agenda' ? '#000' : '#d4af37'} />
                <Text className={`font-bold text-xs mt-1 ${activeTab === 'agenda' ? 'text-black' : 'text-[#d4af37]'}`}>Agenda</Text>
              </TouchableOpacity>
            )}

            {/* Clientes - Todos */}
            {hasPermission('can_view_clients') && (
              <TouchableOpacity 
                onPress={() => {setIsEditing(false); setActiveTab('clientes');}} 
                className={`px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] ${activeTab === 'clientes' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-[#d4af37]'}`}
              >
                <Ionicons name="people" size={20} color={activeTab === 'clientes' ? '#000' : '#d4af37'} />
                <Text className={`font-bold text-xs mt-1 ${activeTab === 'clientes' ? 'text-black' : 'text-[#d4af37]'}`}>Clientes</Text>
              </TouchableOpacity>
            )}

            {/* Serviços - Admin apenas */}
            {hasPermission('can_view_services') && (
              <TouchableOpacity 
                onPress={() => {setIsEditing(false); setActiveTab('servicos');}} 
                className={`px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] ${activeTab === 'servicos' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-[#d4af37]'}`}
              >
                <Ionicons name="cut" size={20} color={activeTab === 'servicos' ? '#000' : '#d4af37'} />
                <Text className={`font-bold text-xs mt-1 ${activeTab === 'servicos' ? 'text-black' : 'text-[#d4af37]'}`}>Serviços</Text>
              </TouchableOpacity>
            )}

            {/* Equipe - Admin apenas */}
            {hasPermission('can_view_team') && (
              <TouchableOpacity 
                onPress={() => {setIsEditing(false); setActiveTab('profissionais');}} 
                className={`px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] ${activeTab === 'profissionais' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-[#d4af37]'}`}
              >
                <Ionicons name="person" size={20} color={activeTab === 'profissionais' ? '#000' : '#d4af37'} />
                <Text className={`font-bold text-xs mt-1 ${activeTab === 'profissionais' ? 'text-black' : 'text-[#d4af37]'}`}>Equipe</Text>
              </TouchableOpacity>
            )}

            {/* Financeiro - Admin apenas */}
            {hasPermission('can_view_finance') && (
              <TouchableOpacity 
                onPress={() => {setIsEditing(false); setActiveTab('financeiro');}} 
                className={`px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] ${activeTab === 'financeiro' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-[#d4af37]'}`}
              >
                <Ionicons name="wallet" size={20} color={activeTab === 'financeiro' ? '#000' : '#d4af37'} />
                <Text className={`font-bold text-xs mt-1 ${activeTab === 'financeiro' ? 'text-black' : 'text-[#d4af37]'}`}>Financeiro</Text>
              </TouchableOpacity>
            )}

            {/* Mensalistas - Admin apenas */}
            {hasPermission('can_view_subscriptions') && (
              <TouchableOpacity 
                onPress={() => {setIsEditing(false); setActiveTab('mensalistas');}} 
                className={`px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] ${activeTab === 'mensalistas' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-[#d4af37]'}`}
              >
                <Ionicons name="card" size={20} color={activeTab === 'mensalistas' ? '#000' : '#d4af37'} />
                <Text className={`font-bold text-xs mt-1 ${activeTab === 'mensalistas' ? 'text-black' : 'text-[#d4af37]'}`}>Mensalistas</Text>
              </TouchableOpacity>
            )}

            {/* Caixa - Admin apenas */}
            {hasPermission('can_view_cash_register') && (
              <TouchableOpacity 
                onPress={() => {setIsEditing(false); setActiveTab('caixa');}} 
                className={`px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] ${activeTab === 'caixa' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-[#d4af37]'}`}
              >
                <Ionicons name="cash" size={20} color={activeTab === 'caixa' ? '#000' : '#d4af37'} />
                <Text className={`font-bold text-xs mt-1 ${activeTab === 'caixa' ? 'text-black' : 'text-[#d4af37]'}`}>Caixa</Text>
              </TouchableOpacity>
            )}

            {/* Relatórios - Fase 4 */}
            <TouchableOpacity 
              onPress={() => router.push('/admin/reports' as any)} 
              className="px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] bg-[#1e1e1e] border border-[#d4af37]"
            >
              <Ionicons name="analytics" size={20} color="#d4af37" />
              <Text className="text-[#d4af37] font-bold text-xs mt-1">Relatórios</Text>
            </TouchableOpacity>

            {/* Cupons - Fase 4 */}
            <TouchableOpacity 
              onPress={() => Alert.alert('Cupons', 'Cupons ativos: PRIMEIRAVISITA (10%), INDICA10 (R$10), VOLTEI (15%). Gerencie no Supabase.')} 
              className="px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] bg-[#1e1e1e] border border-[#d4af37]"
            >
              <Ionicons name="pricetag" size={20} color="#d4af37" />
              <Text className="text-[#d4af37] font-bold text-xs mt-1">Cupons</Text>
            </TouchableOpacity>

            {/* Mais - Admin apenas */}
            {hasPermission('can_view_settings') && (
              <TouchableOpacity 
                onPress={() => {setIsEditing(false); setActiveTab('mais');}} 
                className={`px-4 py-3 rounded-xl mr-3 items-center min-w-[80px] ${activeTab === 'mais' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-[#d4af37]'}`}
              >
                <Ionicons name="ellipsis-horizontal" size={20} color={activeTab === 'mais' ? '#000' : '#d4af37'} />
                <Text className={`font-bold text-xs mt-1 ${activeTab === 'mais' ? 'text-black' : 'text-[#d4af37]'}`}>Mais</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

         <ScrollView className="flex-1 px-4">
           {activeTab === 'clientes' && (
              <>
                {/* Header com título e contador */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white text-lg font-bold">Clientes Cadastrados</Text>
                  <Text className="text-gray-400 text-sm">
                    {clientSearch ? `${clientHistory.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())).length} encontrados` : `${clientHistory.length} clientes`}
                  </Text>
                </View>

                {/* Campo de Busca */}
                <View className="bg-[#1e1e1e] flex-row items-center px-4 py-3 rounded-xl border border-gray-800 mb-4">
                  <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
                  <TextInput
                    value={clientSearch}
                    onChangeText={setClientSearch}
                    placeholder="Buscar cliente por nome..."
                    placeholderTextColor="#666"
                    className="flex-1 text-white"
                  />
                  {clientSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setClientSearch('')}>
                      <Ionicons name="close-circle" size={20} color="#666" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Indicador de ordenação */}
                <View className="flex-row items-center mb-4">
                  <Ionicons name="arrow-up" size={14} color="#666" />
                  <Ionicons name="arrow-down" size={14} color="#666" style={{ marginLeft: -5 }} />
                  <Text className="text-gray-500 text-xs ml-2">Ordem alfabética (A-Z)</Text>
                </View>

                {loadingClients ? <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                : clientHistory.length === 0 ? (
                   <View className="items-center py-16">
                     <Ionicons name="people-outline" size={64} color="#333" />
                     <Text className="text-gray-500 mt-4 text-lg font-bold">Nenhum cliente</Text>
                     <Text className="text-gray-600 text-center mt-2">Ainda não há clientes cadastrados.</Text>
                   </View>
                ) : clientHistory
                   .filter(client => 
                     clientSearch 
                       ? client.name.toLowerCase().includes(clientSearch.toLowerCase())
                       : true
                   )
                   .map((client, idx) => (
                  <View key={client.id || idx} className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 overflow-hidden">
                    {/* Header com nome e badge */}
                    <View className="p-4 border-b border-gray-800">
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1 mr-3">
                          <Text className="text-[#d4af37] font-bold text-lg">{client.name}</Text>
                          {client.phone && (
                            <Text className="text-gray-400 text-sm mt-1">{client.phone}</Text>
                          )}
                        </View>
                        <View className={`px-3 py-1 rounded-full ${client.visits >= 5 ? 'bg-yellow-900/30 border border-[#d4af37]' : client.visits >= 1 ? 'bg-green-900/30 border border-green-700' : 'bg-gray-800 border border-gray-700'}`}>
                          <Text className={`text-xs font-bold ${client.visits >= 5 ? 'text-[#d4af37]' : client.visits >= 1 ? 'text-green-400' : 'text-gray-400'}`}>
                            {client.visits >= 5 ? '⭐ Fiel' : client.visits >= 1 ? `${client.visits}x` : 'Novo'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Estatísticas */}
                    <View className="flex-row p-4 border-b border-gray-800">
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs">Total Gasto</Text>
                        <Text className="text-white font-bold">R$ {client.total.toFixed(2)}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-500 text-xs">Último Serviço</Text>
                        <Text className="text-white font-semibold">{client.lastService || '—'}</Text>
                      </View>
                    </View>

                    {/* Observações */}
                    <View className="p-4 border-b border-gray-800">
                      <View className="flex-row items-center justify-between mb-2">
                        <Text className="text-gray-500 text-xs">Observações</Text>
                        <TouchableOpacity 
                          onPress={() => startEditingNote(client.id, client.notes)}
                          className="flex-row items-center"
                        >
                          <Ionicons name="create-outline" size={14} color="#d4af37" />
                          <Text className="text-[#d4af37] text-xs ml-1">
                            {client.notes ? 'Editar' : 'Adicionar'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      
                      {editingNote === client.id ? (
                        <View>
                          <TextInput
                            value={noteText}
                            onChangeText={setNoteText}
                            placeholder="Ex: Prefere degradê, corta a cada 15 dias..."
                            placeholderTextColor="#666"
                            className="bg-[#121212] text-white p-3 rounded-lg border border-gray-700 mb-2"
                            multiline
                            numberOfLines={3}
                          />
                          <View className="flex-row">
                            <TouchableOpacity 
                              onPress={() => { setEditingNote(null); setNoteText(''); }}
                              className="flex-1 py-2 mr-2 rounded-lg border border-gray-700 items-center"
                            >
                              <Text className="text-gray-400 text-sm">Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                              onPress={() => saveClientNote(client.id)}
                              className="flex-1 py-2 ml-2 rounded-lg bg-[#d4af37] items-center"
                            >
                              <Text className="text-black text-sm font-bold">Salvar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <Text className="text-gray-300 text-sm">
                          {client.notes || 'Nenhuma observação adicionada'}
                        </Text>
                      )}
                    </View>

                    {/* Botões de ação */}
                    <View className="flex-row p-3">
                      <TouchableOpacity 
                        onPress={() => openWhatsApp(client.phone)}
                        className="flex-1 flex-row items-center justify-center py-3 mr-2 rounded-xl bg-green-900/30 border border-green-700"
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#22c55e" style={{ marginRight: 6 }} />
                        <Text className="text-green-400 font-bold text-sm">WhatsApp</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => makePhoneCall(client.phone)}
                        className="flex-1 flex-row items-center justify-center py-3 ml-2 rounded-xl bg-blue-900/30 border border-blue-700"
                      >
                        <Ionicons name="call" size={18} color="#3b82f6" style={{ marginRight: 6 }} />
                        <Text className="text-blue-400 font-bold text-sm">Ligar</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Botão Ver Detalhes */}
                    <TouchableOpacity 
                      onPress={() => loadClientDetails(client.id)}
                      className="flex-row items-center justify-center py-3 border-t border-gray-800"
                    >
                      <Ionicons name={expandedClient === client.id ? 'chevron-up' : 'chevron-down'} size={16} color="#d4af37" style={{ marginRight: 6 }} />
                      <Text className="text-[#d4af37] font-bold text-sm">
                        {expandedClient === client.id ? 'Ocultar Detalhes' : 'Ver Detalhes do Perfil'}
                      </Text>
                    </TouchableOpacity>

                    {/* Seção Expandida de Detalhes */}
                    {expandedClient === client.id && (
                      <View className="border-t border-gray-800">
                        {loadingClientDetails ? (
                          <ActivityIndicator size="small" color="#d4af37" className="py-4" />
                        ) : clientDetails && (
                          <>
                            {/* Carteira Digital */}
                            <View className="p-4 border-b border-gray-800">
                              <View className="flex-row items-center mb-2">
                                <Ionicons name="wallet" size={16} color="#d4af37" style={{ marginRight: 6 }} />
                                <Text className="text-[#d4af37] font-bold text-sm">Carteira Digital</Text>
                              </View>
                              <Text className="text-white text-lg font-bold">
                                R$ {(clientDetails.wallet?.balance || 0).toFixed(2)}
                              </Text>
                            </View>

                            {/* Pontos de Fidelidade */}
                            <View className="p-4 border-b border-gray-800">
                              <View className="flex-row items-center mb-2">
                                <Ionicons name="star" size={16} color="#d4af37" style={{ marginRight: 6 }} />
                                <Text className="text-[#d4af37] font-bold text-sm">Fidelidade</Text>
                              </View>
                              <View className="flex-row items-center justify-between">
                                <Text className="text-white font-bold">
                                  {clientDetails.loyalty?.points || 0} pontos
                                </Text>
                                <View className={`px-3 py-1 rounded-full ${
                                  (clientDetails.loyalty?.level || 'bronze') === 'diamante' ? 'bg-purple-900/30 border border-purple-700' :
                                  (clientDetails.loyalty?.level || 'bronze') === 'ouro' ? 'bg-yellow-900/30 border border-[#d4af37]' :
                                  (clientDetails.loyalty?.level || 'bronze') === 'prata' ? 'bg-gray-600/30 border border-gray-500' :
                                  'bg-orange-900/30 border border-orange-700'
                                }`}>
                                  <Text className={`text-xs font-bold ${
                                    (clientDetails.loyalty?.level || 'bronze') === 'diamante' ? 'text-purple-400' :
                                    (clientDetails.loyalty?.level || 'bronze') === 'ouro' ? 'text-[#d4af37]' :
                                    (clientDetails.loyalty?.level || 'bronze') === 'prata' ? 'text-gray-300' :
                                    'text-orange-400'
                                  }`}>
                                    {(clientDetails.loyalty?.level || 'bronze').toUpperCase()}
                                  </Text>
                                </View>
                              </View>
                            </View>

                            {/* Preferências */}
                            <View className="p-4 border-b border-gray-800">
                              <View className="flex-row items-center mb-3">
                                <Ionicons name="settings" size={16} color="#d4af37" style={{ marginRight: 6 }} />
                                <Text className="text-[#d4af37] font-bold text-sm">Preferências do Cliente</Text>
                              </View>
                              {clientDetails.preferences ? (
                                <View>
                                  {/* Barbeiro e Serviço preferidos */}
                                  {clientDetails.preferences.barbers?.name && (
                                    <View className="flex-row items-center mb-2">
                                      <Ionicons name="person" size={14} color="#666" style={{ marginRight: 8 }} />
                                      <Text className="text-gray-400 text-xs w-20">Barbeiro:</Text>
                                      <Text className="text-white text-sm font-semibold">{clientDetails.preferences.barbers.name}</Text>
                                    </View>
                                  )}
                                  {clientDetails.preferences.services?.name && (
                                    <View className="flex-row items-center mb-2">
                                      <Ionicons name="cut" size={14} color="#666" style={{ marginRight: 8 }} />
                                      <Text className="text-gray-400 text-xs w-20">Serviço:</Text>
                                      <Text className="text-white text-sm font-semibold">{clientDetails.preferences.services.name}</Text>
                                    </View>
                                  )}
                                  {/* Horário e dia preferido */}
                                  {clientDetails.preferences.preferred_time && (
                                    <View className="flex-row items-center mb-2">
                                      <Ionicons name="time" size={14} color="#666" style={{ marginRight: 8 }} />
                                      <Text className="text-gray-400 text-xs w-20">Horário:</Text>
                                      <Text className="text-white text-sm font-semibold">{clientDetails.preferences.preferred_time}</Text>
                                    </View>
                                  )}
                                  {clientDetails.preferences.preferred_day !== null && clientDetails.preferences.preferred_day !== undefined && (
                                    <View className="flex-row items-center mb-2">
                                      <Ionicons name="calendar" size={14} color="#666" style={{ marginRight: 8 }} />
                                      <Text className="text-gray-400 text-xs w-20">Dia:</Text>
                                      <Text className="text-white text-sm font-semibold">
                                        {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'][clientDetails.preferences.preferred_day]}
                                      </Text>
                                    </View>
                                  )}
                                  {/* Tipo de cabelo */}
                                  {clientDetails.preferences.hair_type && (
                                    <View className="flex-row items-center mb-2">
                                      <Text style={{ marginRight: 8 }}>💇</Text>
                                      <Text className="text-gray-400 text-xs w-20">Cabelo:</Text>
                                      <Text className="text-white text-sm font-semibold">{clientDetails.preferences.hair_type}</Text>
                                    </View>
                                  )}
                                  {/* Estilo de barba */}
                                  {clientDetails.preferences.beard_style && (
                                    <View className="flex-row items-center mb-2">
                                      <Text style={{ marginRight: 8 }}>🧔</Text>
                                      <Text className="text-gray-400 text-xs w-20">Barba:</Text>
                                      <Text className="text-white text-sm font-semibold">{clientDetails.preferences.beard_style}</Text>
                                    </View>
                                  )}
                                  {/* Sensibilidade da pele */}
                                  {clientDetails.preferences.skin_sensitivity && (
                                    <View className="flex-row items-center mb-2">
                                      <Text style={{ marginRight: 8 }}>🧴</Text>
                                      <Text className="text-gray-400 text-xs w-20">Pele:</Text>
                                      <Text className="text-white text-sm font-semibold">{clientDetails.preferences.skin_sensitivity}</Text>
                                    </View>
                                  )}
                                  {/* Preferências de produtos */}
                                  {clientDetails.preferences.product_preferences && (
                                    <View className="flex-row items-center mb-2">
                                      <Text style={{ marginRight: 8 }}>🧴</Text>
                                      <Text className="text-gray-400 text-xs w-20">Produtos:</Text>
                                      <Text className="text-white text-sm font-semibold">{clientDetails.preferences.product_preferences}</Text>
                                    </View>
                                  )}
                                  {/* Observações do cliente */}
                                  {clientDetails.preferences.notes && (
                                    <View className="bg-[#121212] p-3 rounded-lg mt-2">
                                      <View className="flex-row items-center mb-1">
                                        <Ionicons name="document-text" size={12} color="#d4af37" style={{ marginRight: 4 }} />
                                        <Text className="text-[#d4af37] text-xs font-bold">Observações do Cliente</Text>
                                      </View>
                                      <Text className="text-gray-300 text-sm italic">&quot;{clientDetails.preferences.notes}&quot;</Text>
                                    </View>
                                  )}
                                </View>
                              ) : (
                                <Text className="text-gray-500 text-sm">Nenhuma preferência cadastrada</Text>
                              )}
                            </View>

                            {/* Agendamento Recorrente */}
                            <View className="p-4 border-b border-gray-800">
                              <View className="flex-row items-center mb-2">
                                <Ionicons name="repeat" size={16} color="#d4af37" style={{ marginRight: 6 }} />
                                <Text className="text-[#d4af37] font-bold text-sm">Agendamento Recorrente</Text>
                              </View>
                              {clientDetails.recurring ? (
                                <View>
                                  <Text className="text-gray-300 text-sm">
                                    ✂️ {clientDetails.recurring.services?.name || 'Serviço'}
                                  </Text>
                                  <Text className="text-gray-300 text-sm">
                                    👨‍🔧 {clientDetails.recurring.barbers?.name || 'Barbeiro'}
                                  </Text>
                                  <Text className="text-gray-300 text-sm">
                                    🔄 {clientDetails.recurring.frequency === 'weekly' ? 'Semanal' : 
                                         clientDetails.recurring.frequency === 'biweekly' ? 'Quinzenal' : 'Mensal'}
                                  </Text>
                                </View>
                              ) : (
                                <Text className="text-gray-500 text-sm">Sem agendamento recorrente</Text>
                              )}
                            </View>

                            {/* Fotos/Galeria */}
                            <View className="p-4">
                              <View className="flex-row items-center mb-2">
                                <Ionicons name="images" size={16} color="#d4af37" style={{ marginRight: 6 }} />
                                <Text className="text-[#d4af37] font-bold text-sm">Galeria ({clientDetails.photos.length})</Text>
                              </View>
                              {clientDetails.photos.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                  {clientDetails.photos.map((photo: any, idx: number) => (
                                    <Image
                                      key={photo.id || idx}
                                      source={{ uri: photo.photo_url }}
                                      className="w-16 h-16 rounded-lg mr-2 bg-gray-800"
                                      resizeMode="cover"
                                    />
                                  ))}
                                </ScrollView>
                               ) : (
                                 <Text className="text-gray-500 text-sm">Nenhuma foto cadastrada</Text>
                               )}
                       </View>
                     </>
                   )}
                       </View>
                     )}
                   </View>
                 ))}
               </>
            )}

            {/* ============================================= */}
             {/* DASHBOARD - Visão Geral do Negócio */}
             {/* ============================================= */}
            {activeTab === 'dashboard' && (
              <>
                {/* Header com sino de notificações */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white text-xl font-bold">Visão Geral</Text>
                  <TouchableOpacity 
                    onPress={() => setShowNotifications(!showNotifications)}
                    className="relative"
                  >
                    <Ionicons name="notifications" size={28} color="#d4af37" />
                    {unreadCount > 0 && (
                      <View className="absolute -top-1 -right-1 bg-red-600 w-5 h-5 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">{unreadCount > 9 ? '9+' : unreadCount}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Painel de Notificações */}
                {showNotifications && (
                  <View className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 overflow-hidden">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-800">
                      <Text className="text-white font-bold">Notificações</Text>
                      <TouchableOpacity onPress={markAllNotificationsAsRead}>
                        <Text className="text-[#d4af37] text-sm">Marcar todas como lidas</Text>
                      </TouchableOpacity>
                    </View>
                    {notifications.length === 0 ? (
                      <View className="items-center py-8">
                        <Ionicons name="notifications-off-outline" size={40} color="#333" />
                        <Text className="text-gray-500 mt-2">Nenhuma notificação</Text>
                      </View>
                    ) : (
                      <ScrollView style={{ maxHeight: 300 }}>
                        {notifications.slice(0, 10).map((notif) => (
                          <TouchableOpacity 
                            key={notif.id}
                            onPress={() => markNotificationAsRead(notif.id)}
                            className={`p-4 border-b border-gray-800 flex-row items-center ${!notif.is_read ? 'bg-[#d4af37]/10' : ''}`}
                          >
                            <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                              notif.type === 'new_appointment' ? 'bg-green-900/30' :
                              notif.type === 'subscription_low' ? 'bg-yellow-900/30' :
                              notif.type === 'review' ? 'bg-purple-900/30' :
                              'bg-blue-900/30'
                            }`}>
                              <Ionicons 
                                name={
                                  notif.type === 'new_appointment' ? 'calendar' :
                                  notif.type === 'subscription_low' ? 'card' :
                                  notif.type === 'review' ? 'star' :
                                  'notifications'
                                } 
                                size={20} 
                                color={
                                  notif.type === 'new_appointment' ? '#22c55e' :
                                  notif.type === 'subscription_low' ? '#eab308' :
                                  notif.type === 'review' ? '#a855f7' :
                                  '#3b82f6'
                                } 
                              />
                            </View>
                            <View className="flex-1">
                              <Text className="text-white font-semibold">{notif.title}</Text>
                              <Text className="text-gray-400 text-sm">{notif.message}</Text>
                              <Text className="text-gray-600 text-xs mt-1">
                                {new Date(notif.created_at).toLocaleString('pt-BR')}
                              </Text>
                            </View>
                            {!notif.is_read && (
                              <View className="w-2 h-2 rounded-full bg-[#d4af37]" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                )}
                
                {loadingDashboard ? (
                  <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                ) : (
                  <>
                    {/* Cards de Métricas Principais */}
                    <View className="flex-row flex-wrap mb-4" style={{ gap: 12 }}>
                      {/* Agendamentos Hoje */}
                      <View className="flex-1 min-w-[45%] bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
                        <View className="flex-row items-center justify-between mb-2">
                          <Ionicons name="calendar" size={24} color="#d4af37" />
                          <Text className="text-[#d4af37] text-2xl font-bold">{dashboardData.appointmentsToday}</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">Agendamentos Hoje</Text>
                      </View>

                      {/* Faturamento Hoje */}
                      <View className="flex-1 min-w-[45%] bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
                        <View className="flex-row items-center justify-between mb-2">
                          <Ionicons name="cash" size={24} color="#22c55e" />
                          <Text className="text-green-400 text-lg font-bold">R$ {dashboardData.revenueToday.toFixed(2)}</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">Faturamento Hoje</Text>
                      </View>

                      {/* Taxa de Ocupação */}
                      <View className="flex-1 min-w-[45%] bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
                        <View className="flex-row items-center justify-between mb-2">
                          <Ionicons name="speedometer" size={24} color="#f59e0b" />
                          <Text className="text-yellow-400 text-2xl font-bold">{dashboardData.occupancyRate}%</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">Ocupação Hoje</Text>
                        <View className="bg-gray-800 rounded-full h-2 mt-2 overflow-hidden">
                          <View 
                            className={`h-full rounded-full ${dashboardData.occupancyRate >= 80 ? 'bg-green-500' : dashboardData.occupancyRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${dashboardData.occupancyRate}%` }}
                          />
                        </View>
                      </View>

                      {/* Ticket Médio */}
                      <View className="flex-1 min-w-[45%] bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
                        <View className="flex-row items-center justify-between mb-2">
                          <Ionicons name="pricetag" size={24} color="#a855f7" />
                          <Text className="text-purple-400 text-lg font-bold">R$ {dashboardData.ticketAverage.toFixed(2)}</Text>
                        </View>
                        <Text className="text-gray-400 text-sm">Ticket Médio</Text>
                      </View>
                    </View>

                    {/* Comparação Semanal */}
                    <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-4">
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-gray-400 text-xs">Faturamento Semanal</Text>
                          <Text className="text-white font-bold text-xl">R$ {dashboardData.weekComparison.current.toFixed(2)}</Text>
                        </View>
                        <View className={`flex-row items-center px-3 py-1 rounded-full ${dashboardData.weekComparison.change >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                          <Ionicons 
                            name={dashboardData.weekComparison.change >= 0 ? "trending-up" : "trending-down"} 
                            size={16} 
                            color={dashboardData.weekComparison.change >= 0 ? '#22c55e' : '#f87171'} 
                          />
                          <Text className={`ml-1 font-bold ${dashboardData.weekComparison.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {dashboardData.weekComparison.change >= 0 ? '+' : ''}{dashboardData.weekComparison.change}%
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Timeline do Dia */}
                    <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-4">
                      <Text className="text-white font-bold mb-3">Agenda de Hoje</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {dashboardData.todayTimeline.map((slot, idx) => (
                          <View 
                            key={idx}
                            className={`w-12 h-16 rounded-lg mr-2 items-center justify-center ${slot.occupied ? 'bg-[#d4af37]' : 'bg-[#121212] border border-gray-700'}`}
                          >
                            <Text className={`text-xs font-bold ${slot.occupied ? 'text-black' : 'text-gray-500'}`}>{slot.hour}</Text>
                            {slot.occupied && <Ionicons name="person" size={14} color="#000" />}
                          </View>
                        ))}
                      </ScrollView>
                    </View>

                    {/* Próximos Clientes */}
                    {dashboardData.clientsToday.length > 0 && (
                      <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-4">
                        <View className="flex-row items-center justify-between mb-3">
                          <Text className="text-white font-bold">Próximos Clientes</Text>
                          <TouchableOpacity onPress={() => setActiveTab('agenda')}>
                            <Text className="text-[#d4af37] text-sm">Ver todos</Text>
                          </TouchableOpacity>
                        </View>
                        {dashboardData.clientsToday.map((client) => (
                          <View key={client.id} className="flex-row items-center justify-between py-2 border-b border-gray-800">
                            <View className="flex-row items-center flex-1">
                              <View className="w-10 h-10 rounded-full bg-[#121212] items-center justify-center mr-3">
                                <Text className="text-[#d4af37] font-bold">{client.time}</Text>
                              </View>
                              <View className="flex-1">
                                <Text className="text-white font-semibold">{client.name}</Text>
                                <Text className="text-gray-400 text-xs">{client.service}</Text>
                              </View>
                            </View>
                            {client.phone && (
                              <TouchableOpacity 
                                onPress={() => Linking.openURL(`tel:${client.phone.replace(/\D/g, '')}`)}
                                className="p-2"
                              >
                                <Ionicons name="call" size={20} color="#22c55e" />
                              </TouchableOpacity>
                            )}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Serviços Mais Populares */}
                    {dashboardData.popularServices.length > 0 && (
                      <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-4">
                        <Text className="text-white font-bold mb-3">Serviços Mais Populares (30d)</Text>
                        {dashboardData.popularServices.map((svc, idx) => (
                          <View key={idx} className="flex-row items-center justify-between py-2">
                            <View className="flex-row items-center">
                              <Text className="text-[#d4af37] font-bold mr-3">#{idx + 1}</Text>
                              <Text className="text-white">{svc.name}</Text>
                            </View>
                            <Text className="text-gray-400">{svc.count}x</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Avaliações Recentes */}
                    {dashboardData.recentReviews.length > 0 && (
                      <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-4">
                        <Text className="text-white font-bold mb-3">Avaliações Recentes</Text>
                        {dashboardData.recentReviews.map((review) => (
                          <View key={review.id} className="py-2 border-b border-gray-800">
                            <View className="flex-row items-center justify-between mb-1">
                              <Text className="text-white font-semibold">{review.profiles?.full_name || 'Cliente'}</Text>
                              <View className="flex-row">
                                {[1,2,3,4,5].map(s => (
                                  <Ionicons key={s} name={s <= review.rating ? "star" : "star-outline"} size={14} color="#d4af37" />
                                ))}
                              </View>
                            </View>
                            {review.comment && (
                              <Text className="text-gray-400 text-sm" numberOfLines={2}>{review.comment}</Text>
                            )}
                            <Text className="text-gray-600 text-xs mt-1">{review.barbers?.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Barbeiro Destaque */}
                    {dashboardData.topBarber && (
                      <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-[#d4af37] mb-4">
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 rounded-full bg-[#d4af37] items-center justify-center mr-3">
                            <Ionicons name="trophy" size={24} color="#000" />
                          </View>
                          <View className="flex-1">
                            <Text className="text-gray-400 text-xs">Destaque do Dia</Text>
                            <Text className="text-white font-bold text-lg">{dashboardData.topBarber.name}</Text>
                            <Text className="text-[#d4af37]">{dashboardData.topBarber.count} atendimentos hoje</Text>
                          </View>
                        </View>
                      </View>
                    )}

                    {/* ============================================= */}
                    {/* GRÁFICOS DO DASHBOARD */}
                    {/* ============================================= */}
                    
                    {/* Gráfico 1: Faturamento dos Últimos 7 Dias */}
                    <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-4">
                      <View className="flex-row items-center justify-between mb-4">
                        <Text className="text-white font-bold">Faturamento dos Últimos 7 Dias</Text>
                        <Ionicons name="bar-chart" size={20} color="#d4af37" />
                      </View>
                      <View className="flex-row items-end justify-between" style={{ height: 120 }}>
                        {weeklyRevenue.map((value, idx) => {
                          const maxValue = Math.max(...weeklyRevenue, 1);
                          const height = (value / maxValue) * 100;
                          const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                          const today = new Date();
                          const dayIndex = (today.getDay() - 6 + idx + 7) % 7;
                          
                          return (
                            <View key={idx} className="items-center flex-1">
                              <Text className="text-gray-400 text-xs mb-1">
                                {value > 0 ? `R$${(value/1000).toFixed(1)}k` : ''}
                              </Text>
                              <View 
                                className="rounded-t-lg mx-1"
                                style={{ 
                                  height: Math.max(height, 4), 
                                  width: '70%',
                                  backgroundColor: value === Math.max(...weeklyRevenue) ? '#d4af37' : '#444'
                                }}
                              />
                              <Text className="text-gray-500 text-xs mt-2">{dayNames[dayIndex]}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Gráfico 2: Horários Mais Procurados */}
                    {hourlyDistribution.length > 0 && (
                      <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-4">
                        <View className="flex-row items-center justify-between mb-4">
                          <Text className="text-white font-bold">Horários Mais Procurados (30d)</Text>
                          <Ionicons name="time" size={20} color="#d4af37" />
                        </View>
                        {hourlyDistribution.map((item, idx) => {
                          const maxCount = Math.max(...hourlyDistribution.map(h => h.count), 1);
                          const width = (item.count / maxCount) * 100;
                          
                          return (
                            <View key={idx} className="flex-row items-center mb-2">
                              <Text className="text-gray-400 text-xs w-10">{item.hour}</Text>
                              <View className="flex-1 h-5 bg-gray-800 rounded-full mx-2 overflow-hidden">
                                <View 
                                  className="h-full rounded-full bg-[#d4af37]"
                                  style={{ width: `${Math.max(width, 5)}%` }}
                                />
                              </View>
                              <Text className="text-gray-400 text-xs w-12 text-right">{item.count}x</Text>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Gráfico 3: Desempenho dos Barbeiros */}
                    {barberPerformance.length > 0 && (
                      <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-4">
                        <View className="flex-row items-center justify-between mb-4">
                          <Text className="text-white font-bold">Desempenho dos Barbeiros (30d)</Text>
                          <Ionicons name="people" size={20} color="#d4af37" />
                        </View>
                        {barberPerformance.map((barber, idx) => {
                          const maxCount = Math.max(...barberPerformance.map(b => b.count), 1);
                          const width = (barber.count / maxCount) * 100;
                          const colors = ['#d4af37', '#22c55e', '#3b82f6', '#a855f7', '#f59e0b'];
                          
                          return (
                            <View key={idx} className="mb-3">
                              <View className="flex-row items-center justify-between mb-1">
                                <View className="flex-row items-center">
                                  <View 
                                    className="w-6 h-6 rounded-full items-center justify-center mr-2"
                                    style={{ backgroundColor: colors[idx] || '#666' }}
                                  >
                                    <Text className="text-black text-xs font-bold">{idx + 1}</Text>
                                  </View>
                                  <Text className="text-white text-sm">{barber.name.split(' ')[0]}</Text>
                                </View>
                                <Text className="text-gray-400 text-xs">{barber.count} atendimentos</Text>
                              </View>
                              <View className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                <View 
                                  className="h-full rounded-full"
                                  style={{ 
                                    width: `${Math.max(width, 5)}%`,
                                    backgroundColor: colors[idx] || '#666'
                                  }}
                                />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}

                    {/* Atalhos Rápidos */}
                    <Text className="text-white font-bold mb-3">Atalhos Rápidos</Text>
                    <View className="flex-row flex-wrap mb-4" style={{ gap: 12 }}>
                      <TouchableOpacity 
                        onPress={() => setActiveTab('agenda')}
                        className="flex-1 min-w-[30%] bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 items-center"
                      >
                        <Ionicons name="calendar" size={28} color="#d4af37" />
                        <Text className="text-gray-400 text-xs mt-2">Agenda</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setActiveTab('caixa')}
                        className="flex-1 min-w-[30%] bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 items-center"
                      >
                        <Ionicons name="cash" size={28} color="#22c55e" />
                        <Text className="text-gray-400 text-xs mt-2">Caixa</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setActiveTab('clientes')}
                        className="flex-1 min-w-[30%] bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 items-center"
                      >
                        <Ionicons name="people" size={28} color="#a855f7" />
                        <Text className="text-gray-400 text-xs mt-2">Clientes</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setActiveTab('financeiro')}
                        className="flex-1 min-w-[30%] bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 items-center"
                      >
                        <Ionicons name="wallet" size={28} color="#3b82f6" />
                        <Text className="text-gray-400 text-xs mt-2">Financeiro</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={() => setActiveTab('mais')}
                        className="flex-1 min-w-[30%] bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 items-center"
                      >
                        <Ionicons name="ellipsis-horizontal" size={28} color="#f59e0b" />
                        <Text className="text-gray-400 text-xs mt-2">Mais</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Botão Atualizar */}
                    <TouchableOpacity 
                      onPress={fetchDashboardData}
                      className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 flex-row items-center justify-center mb-4"
                    >
                      <Ionicons name="refresh" size={20} color="#d4af37" style={{ marginRight: 8 }} />
                      <Text className="text-[#d4af37] font-bold">Atualizar Dados</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            )}

           {activeTab === 'agenda' && (
              <>
                {/* Sub-tabs da Agenda */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <TouchableOpacity 
                    onPress={() => setAgendaView('proximos')}
                    className={`px-4 py-3 rounded-xl mr-2 ${agendaView === 'proximos' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="calendar" size={16} color={agendaView === 'proximos' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                      <Text className={`font-bold text-sm ${agendaView === 'proximos' ? 'text-black' : 'text-gray-400'}`}>Próximos</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setAgendaView('ultimos')}
                    className={`px-4 py-3 rounded-xl mr-2 ${agendaView === 'ultimos' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="time" size={16} color={agendaView === 'ultimos' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                      <Text className={`font-bold text-sm ${agendaView === 'ultimos' ? 'text-black' : 'text-gray-400'}`}>Últimos</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => { setAgendaView('bloqueios'); fetchScheduleBlocks(); }}
                    className={`px-4 py-3 rounded-xl mr-2 ${agendaView === 'bloqueios' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="lock-closed" size={16} color={agendaView === 'bloqueios' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                      <Text className={`font-bold text-sm ${agendaView === 'bloqueios' ? 'text-black' : 'text-gray-400'}`}>Bloqueios</Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => { setAgendaView('espera'); fetchWaitingList(); }}
                    className={`px-4 py-3 rounded-xl mr-2 ${agendaView === 'espera' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                  >
                    <View className="flex-row items-center">
                      <Ionicons name="people" size={16} color={agendaView === 'espera' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                      <Text className={`font-bold text-sm ${agendaView === 'espera' ? 'text-black' : 'text-gray-400'}`}>Espera</Text>
                      {waitingList.length > 0 && (
                        <View className="bg-red-600 w-5 h-5 rounded-full items-center justify-center ml-2">
                          <Text className="text-white text-xs font-bold">{waitingList.length}</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </ScrollView>

                {/* Título da seção */}
                {agendaView !== 'bloqueios' && agendaView !== 'espera' && (
                  <Text className="text-white text-lg font-bold mb-4">
                    {agendaView === 'proximos' ? 'Próximos Agendamentos' : 'Últimos Agendamentos'}
                  </Text>
                )}

                {agendaView !== 'bloqueios' && agendaView !== 'espera' && (
                  loadingAgenda ? (
                    <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                  ) : appointments.length === 0 ? (
                    <View className="items-center py-16">
                      <Ionicons name={agendaView === 'proximos' ? 'calendar-outline' : 'time-outline'} size={64} color="#333" />
                      <Text className="text-gray-500 mt-4 text-lg font-bold">
                        {agendaView === 'proximos' ? 'Nenhum agendamento futuro' : 'Nenhum agendamento passado'}
                      </Text>
                      <Text className="text-gray-600 text-center mt-2">
                        {agendaView === 'proximos' ? 'Todos os horários estão livres!' : 'Ainda não houve atendimentos.'}
                      </Text>
                    </View>
                  ) : (
                    <>
                      {appointments.map((appt) => {
                        // Formatar data igual ao layout do cliente
                        const d = new Date(appt.appointment_date);
                        const day = d.getDate().toString().padStart(2, '0');
                        const month = (d.getMonth() + 1).toString().padStart(2, '0');
                        const hours = d.getHours().toString().padStart(2, '0');
                        const minutes = d.getMinutes().toString().padStart(2, '0');
                        const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                        const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                        const dayName = dayNames[d.getDay()];
                        const monthName = monthNames[d.getMonth()];
                        const time = `${hours}:${minutes}`;
                        
                        const statusInfo = appt.status === 'confirmed' 
                          ? { bg: 'bg-green-900/30', border: 'border-green-700', text: 'text-green-400', label: 'Confirmado', icon: 'checkmark-circle' }
                          : appt.status === 'completed'
                          ? { bg: 'bg-blue-900/30', border: 'border-blue-700', text: 'text-blue-400', label: 'Concluído', icon: 'checkmark-done-circle' }
                          : appt.status === 'cancelled'
                          ? { bg: 'bg-red-900/30', border: 'border-red-700', text: 'text-red-400', label: 'Cancelado', icon: 'close-circle' }
                          : { bg: 'bg-yellow-900/30', border: 'border-yellow-700', text: 'text-yellow-400', label: 'Pendente', icon: 'time' };

                        return (
                          <View key={appt.id} className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4">
                            <View className="flex-row">
                              <View className={`${appt.status === 'completed' || appt.status === 'cancelled' ? 'bg-gray-700' : 'bg-[#d4af37]'} p-4 items-center justify-center rounded-l-2xl`} style={{ width: 80 }}>
                                <Text className={`${appt.status === 'completed' || appt.status === 'cancelled' ? 'text-white' : 'text-black'} font-bold text-2xl`}>{day}</Text>
                                <Text className={`${appt.status === 'completed' || appt.status === 'cancelled' ? 'text-gray-400' : 'text-black'} text-xs font-semibold`}>{dayName}</Text>
                                <Text className={`${appt.status === 'completed' || appt.status === 'cancelled' ? 'text-gray-500' : 'text-black/70'} text-xs`}>{monthName}</Text>
                              </View>
                              <View className="flex-1 p-4">
                                <View className="flex-row justify-between items-start mb-2">
                                  <View className="flex-1 mr-2">
                                    <Text className="text-white font-bold text-lg">{appt.client_name || 'Cliente'}</Text>
                                    <Text className="text-gray-400">com {appt.barbers?.name?.split(' ')[0] || 'Barbeiro'}</Text>
                                  </View>
                                  <View className={`px-3 py-1.5 rounded-full ${statusInfo.bg} border ${statusInfo.border} flex-row items-center`}>
                                    <Ionicons name={statusInfo.icon as any} size={12} color={appt.status === 'confirmed' ? '#22c55e' : appt.status === 'completed' ? '#60a5fa' : appt.status === 'cancelled' ? '#f87171' : '#fbbf24'} style={{ marginRight: 4 }} />
                                    <Text className={`text-xs font-bold ${statusInfo.text}`}>{statusInfo.label}</Text>
                                  </View>
                                </View>
                                <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-800">
                                  <View className="flex-row items-center">
                                    <Ionicons name="time-outline" size={16} color="#d4af37" style={{ marginRight: 6 }} />
                                    <Text className="text-[#d4af37] font-bold">{time}</Text>
                                  </View>
                                  {appt.services?.price && (
                                    <Text className="text-gray-400">R$ {appt.services.price.toFixed(2)}</Text>
                                  )}
                                </View>
                              </View>
                            </View>
                            
                            {/* Botões de Ação - Só aparecem se ainda não concluído/cancelado */}
                            {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                              <View className="flex-row px-4 pb-4 pt-2 border-t border-gray-800">
                                <TouchableOpacity 
                                  onPress={() => updateAppointmentStatus(appt.id, 'completed')}
                                  className="flex-1 flex-row items-center justify-center py-3 mr-2 rounded-xl bg-green-900/30 border border-green-700"
                                >
                                  <Ionicons name="checkmark-circle" size={18} color="#22c55e" style={{ marginRight: 6 }} />
                                  <Text className="text-green-400 font-bold text-sm">Concluir</Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  onPress={() => updateAppointmentStatus(appt.id, 'cancelled')}
                                  className="flex-1 flex-row items-center justify-center py-3 ml-2 rounded-xl bg-red-900/30 border border-red-700"
                                >
                                  <Ionicons name="close-circle" size={18} color="#f87171" style={{ marginRight: 6 }} />
                                  <Text className="text-red-400 font-bold text-sm">Cancelar</Text>
                                </TouchableOpacity>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </>
                  )
                )}
              </>
           )}

           {/* Seção de Bloqueios - aparece quando agendaView === 'bloqueios' */}
           {activeTab === 'agenda' && agendaView === 'bloqueios' && (
              <>
                {/* Header com botão adicionar */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white text-lg font-bold">Bloqueios de Horário</Text>
                  <View className="flex-row">
                    <TouchableOpacity 
                      onPress={addLunchBlockForAll}
                      className="bg-[#1e1e1e] border border-gray-700 px-3 py-2 rounded-xl mr-2 flex-row items-center"
                    >
                      <Ionicons name="fast-food" size={16} color="#d4af37" style={{ marginRight: 4 }} />
                      <Text className="text-gray-400 text-xs">Almoço</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setShowAddBlock(true)}
                      className="bg-[#d4af37] px-4 py-2 rounded-xl flex-row items-center"
                    >
                      <Ionicons name="add" size={18} color="#000" />
                      <Text className="text-black font-bold ml-1">Novo</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Modal de adicionar bloqueio */}
                {showAddBlock && (
                  <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mb-4">
                    <Text className="text-white font-bold text-lg mb-4">Adicionar Bloqueio</Text>
                    
                    {/* Selecionar barbeiro */}
                    <Text className="text-gray-400 text-xs mb-2">Barbeiro</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                      {barbers.map((b) => (
                        <TouchableOpacity
                          key={b.id}
                          onPress={() => setBlockBarber(b)}
                          className={`px-4 py-2 rounded-xl mr-2 ${blockBarber?.id === b.id ? 'bg-[#d4af37]' : 'bg-[#121212] border border-gray-700'}`}
                        >
                          <Text className={`text-sm ${blockBarber?.id === b.id ? 'text-black font-bold' : 'text-gray-400'}`}>
                            {b.name.split(' ')[0]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Data */}
                    <Text className="text-gray-400 text-xs mb-2">Data</Text>
                    <TextInput
                      value={blockDate}
                      onChangeText={setBlockDate}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor="#666"
                      className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                    />

                    {/* Horários */}
                    <View className="flex-row mb-4">
                      <View className="flex-1 mr-2">
                        <Text className="text-gray-400 text-xs mb-2">Início</Text>
                        <TextInput
                          value={blockStartTime}
                          onChangeText={setBlockStartTime}
                          placeholder="HH:MM"
                          placeholderTextColor="#666"
                          className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700"
                        />
                      </View>
                      <View className="flex-1 ml-2">
                        <Text className="text-gray-400 text-xs mb-2">Fim</Text>
                        <TextInput
                          value={blockEndTime}
                          onChangeText={setBlockEndTime}
                          placeholder="HH:MM"
                          placeholderTextColor="#666"
                          className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700"
                        />
                      </View>
                    </View>

                    {/* Motivo */}
                    <Text className="text-gray-400 text-xs mb-2">Motivo (opcional)</Text>
                    <TextInput
                      value={blockReason}
                      onChangeText={setBlockReason}
                      placeholder="Ex: Almoço, Folga, Feriado"
                      placeholderTextColor="#666"
                      className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                    />

                    {/* Recorrente */}
                    <TouchableOpacity 
                      onPress={() => setBlockIsRecurring(!blockIsRecurring)}
                      className="flex-row items-center mb-4"
                    >
                      <View className={`w-6 h-6 rounded-md border-2 mr-3 items-center justify-center ${blockIsRecurring ? 'bg-[#d4af37] border-[#d4af37]' : 'border-gray-600'}`}>
                        {blockIsRecurring && <Ionicons name="checkmark" size={16} color="#000" />}
                      </View>
                      <Text className="text-gray-400">Repetir toda semana neste dia</Text>
                    </TouchableOpacity>

                    {/* Botões */}
                    <View className="flex-row">
                      <TouchableOpacity 
                        onPress={() => { setShowAddBlock(false); resetBlockForm(); }}
                        className="flex-1 py-3 mr-2 rounded-xl border border-gray-700 items-center"
                      >
                        <Text className="text-gray-400 font-bold">Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={addScheduleBlock}
                        className="flex-1 py-3 ml-2 rounded-xl bg-[#d4af37] items-center"
                      >
                        <Text className="text-black font-bold">Bloquear</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Filtro por barbeiro */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                  <TouchableOpacity 
                    onPress={() => setSelectedBarberFilter('all')}
                    className={`px-4 py-2 rounded-xl mr-2 ${selectedBarberFilter === 'all' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                  >
                    <Text className={`text-sm font-bold ${selectedBarberFilter === 'all' ? 'text-black' : 'text-gray-400'}`}>Todos</Text>
                  </TouchableOpacity>
                  {barbers.map((b) => (
                    <TouchableOpacity 
                      key={b.id}
                      onPress={() => setSelectedBarberFilter(b.id)}
                      className={`px-4 py-2 rounded-xl mr-2 ${selectedBarberFilter === b.id ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                    >
                      <Text className={`text-sm font-bold ${selectedBarberFilter === b.id ? 'text-black' : 'text-gray-400'}`}>
                        {b.name.split(' ')[0]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Lista de bloqueios */}
                {loadingBlocks ? (
                  <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                ) : scheduleBlocks.length === 0 ? (
                  <View className="items-center py-16">
                    <Ionicons name="lock-open-outline" size={64} color="#333" />
                    <Text className="text-gray-500 mt-4 text-lg font-bold">Nenhum bloqueio</Text>
                    <Text className="text-gray-600 text-center mt-2">Adicione bloqueios para folgas, almoço ou feriados</Text>
                  </View>
                ) : scheduleBlocks
                    .filter(block => selectedBarberFilter === 'all' || block.barber_id === selectedBarberFilter)
                    .map((block) => {
                  const d = new Date(block.block_date + 'T12:00:00');
                  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                  
                  return (
                    <View key={block.id} className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 overflow-hidden">
                      <View className="flex-row">
                        {/* Data */}
                        <View className="bg-red-900/30 p-4 items-center justify-center" style={{ width: 70 }}>
                          <Text className="text-red-400 font-bold text-lg">{d.getDate()}</Text>
                          <Text className="text-red-400/70 text-xs">{dayNames[d.getDay()]}</Text>
                        </View>
                        
                        {/* Info */}
                        <View className="flex-1 p-4">
                          <View className="flex-row justify-between items-start mb-2">
                            <View>
                              <Text className="text-white font-bold">{block.barbers?.name || 'Barbeiro'}</Text>
                              <Text className="text-gray-400 text-sm">{block.reason || 'Bloqueado'}</Text>
                            </View>
                            {block.is_recurring && (
                              <View className="bg-purple-900/30 px-2 py-1 rounded-full border border-purple-700">
                                <Text className="text-purple-400 text-xs font-bold">Recorrente</Text>
                              </View>
                            )}
                          </View>
                          <View className="flex-row items-center">
                            <Ionicons name="time-outline" size={14} color="#f87171" style={{ marginRight: 6 }} />
                            <Text className="text-red-400 font-bold">{block.start_time} - {block.end_time}</Text>
                          </View>
                        </View>
                        
                        {/* Botão remover */}
                        <TouchableOpacity 
                          onPress={() => removeScheduleBlock(block.id)}
                          className="p-4 items-center justify-center"
                        >
                          <Ionicons name="trash-outline" size={20} color="#f87171" />
                        </TouchableOpacity>
                      </View>
                    </View>
                    );
                 })}

                 {/* ============================================= */}
                 {/* SEÇÃO DE METAS MENSAIS */}
                 {/* ============================================= */}
                 <View className="mt-6 pt-6 border-t border-gray-800">
                   <Text className="text-white font-bold text-lg mb-4">Metas do Mês</Text>
                   
                   {loadingGoals ? (
                     <ActivityIndicator size="large" color="#d4af37" />
                   ) : barbers.map((b) => {
                     const goal = barberGoals.find(g => g.barber_id === b.id);
                     const isEditing = editingGoal === b.id;
                     
                     const apptProgress = goal ? (goal.current_appointments / goal.target_appointments) * 100 : 0;
                     const revProgress = goal ? (goal.current_revenue / goal.target_revenue) * 100 : 0;

                     return (
                       <View key={b.id} className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 p-4">
                         <View className="flex-row justify-between items-center mb-3">
                           <Text className="text-white font-bold">{b.name}</Text>
                           <TouchableOpacity 
                             onPress={() => {
                               setEditingGoal(isEditing ? null : b.id);
                               setGoalAppointments(goal?.target_appointments?.toString() || '');
                               setGoalRevenue(goal?.target_revenue?.toString() || '');
                             }}
                           >
                             <Ionicons name={isEditing ? "close" : "settings"} size={18} color="#d4af37" />
                           </TouchableOpacity>
                         </View>

                         {goal ? (
                           <>
                             {/* Meta de Atendimentos */}
                             <View className="mb-3">
                               <View className="flex-row justify-between mb-1">
                                 <Text className="text-gray-400 text-xs">Atendimentos</Text>
                                 <Text className="text-white text-xs font-bold">{goal.current_appointments} / {goal.target_appointments}</Text>
                               </View>
                               <View className="bg-gray-800 rounded-full h-3 overflow-hidden">
                                 <View 
                                   className={`h-full rounded-full ${apptProgress >= 100 ? 'bg-green-500' : apptProgress >= 70 ? 'bg-[#d4af37]' : 'bg-blue-500'}`}
                                   style={{ width: `${Math.min(apptProgress, 100)}%` }}
                                 />
                               </View>
                             </View>

                             {/* Meta de Faturamento */}
                             <View>
                               <View className="flex-row justify-between mb-1">
                                 <Text className="text-gray-400 text-xs">Faturamento</Text>
                                 <Text className="text-white text-xs font-bold">R$ {goal.current_revenue.toFixed(2)} / R$ {goal.target_revenue.toFixed(2)}</Text>
                               </View>
                               <View className="bg-gray-800 rounded-full h-3 overflow-hidden">
                                 <View 
                                   className={`h-full rounded-full ${revProgress >= 100 ? 'bg-green-500' : revProgress >= 70 ? 'bg-[#d4af37]' : 'bg-blue-500'}`}
                                   style={{ width: `${Math.min(revProgress, 100)}%` }}
                                 />
                               </View>
                             </View>
                           </>
                         ) : (
                           <Text className="text-gray-500 text-sm">Meta não configurada</Text>
                         )}

                         {/* Formulário de edição de meta */}
                         {isEditing && (
                           <View className="mt-4 pt-4 border-t border-gray-800">
                             <Text className="text-gray-400 text-xs mb-2">Meta de Atendimentos</Text>
                             <TextInput
                               value={goalAppointments}
                               onChangeText={setGoalAppointments}
                               placeholder="Ex: 100"
                               placeholderTextColor="#666"
                               keyboardType="numeric"
                               className="bg-[#121212] text-white p-3 rounded-lg border border-gray-700 mb-3"
                             />
                             <Text className="text-gray-400 text-xs mb-2">Meta de Faturamento (R$)</Text>
                             <TextInput
                               value={goalRevenue}
                               onChangeText={setGoalRevenue}
                               placeholder="Ex: 5000"
                               placeholderTextColor="#666"
                               keyboardType="numeric"
                               className="bg-[#121212] text-white p-3 rounded-lg border border-gray-700 mb-3"
                             />
                             <TouchableOpacity 
                               onPress={() => saveBarberGoal(b.id)}
                               className="bg-[#d4af37] py-3 rounded-xl items-center"
                             >
                               <Text className="text-black font-bold">Salvar Meta</Text>
                             </TouchableOpacity>
                           </View>
                         )}
                       </View>
                     );
                   })}
                 </View>

                 {/* ============================================= */}
                 {/* SEÇÃO DE AVALIAÇÕES */}
                 {/* ============================================= */}
                 <View className="mt-6 pt-6 border-t border-gray-800">
                   <Text className="text-white font-bold text-lg mb-4">Avaliações Recentes</Text>
                   
                   {loadingReviews ? (
                     <ActivityIndicator size="large" color="#d4af37" />
                   ) : reviews.length === 0 ? (
                     <View className="items-center py-8">
                       <Ionicons name="star-outline" size={40} color="#333" />
                       <Text className="text-gray-500 mt-2">Nenhuma avaliação ainda</Text>
                     </View>
                   ) : (
                     <>
                       {/* Média por barbeiro */}
                       <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                         {barbers.map((b) => {
                           const rating = barberRatings[b.id];
                           return (
                             <View key={b.id} className="bg-[#121212] p-4 rounded-xl mr-3 items-center" style={{ minWidth: 120 }}>
                               <Text className="text-white font-bold text-sm mb-2">{b.name.split(' ')[0]}</Text>
                               <View className="flex-row items-center">
                                 <Ionicons name="star" size={16} color="#d4af37" />
                                 <Text className="text-[#d4af37] font-bold ml-1">
                                   {rating ? rating.avg.toFixed(1) : '-'}
                                 </Text>
                               </View>
                               <Text className="text-gray-500 text-xs mt-1">
                                 {rating ? `${rating.count} avaliações` : 'Sem avaliações'}
                               </Text>
                             </View>
                           );
                         })}
                       </ScrollView>

                       {/* Lista de avaliações */}
                       {reviews.slice(0, 10).map((review) => (
                         <View key={review.id} className="bg-[#121212] p-4 rounded-xl mb-2">
                           <View className="flex-row justify-between items-start mb-2">
                             <View>
                               <Text className="text-white font-semibold">{review.profiles?.full_name || 'Cliente'}</Text>
                               <Text className="text-gray-500 text-xs">{review.barbers?.name}</Text>
                             </View>
                             <View className="flex-row">
                               {[1, 2, 3, 4, 5].map((star) => (
                                 <Ionicons 
                                   key={star}
                                   name={star <= review.rating ? "star" : "star-outline"} 
                                   size={16} 
                                   color="#d4af37" 
                                 />
                               ))}
                             </View>
                           </View>
                           {review.comment && (
                             <Text className="text-gray-300 text-sm">{review.comment}</Text>
                           )}
                           <Text className="text-gray-600 text-xs mt-2">
                             {new Date(review.created_at).toLocaleDateString('pt-BR')}
                           </Text>
                         </View>
                       ))}
                     </>
                   )}
                 </View>
               </>
            )}

           {/* ============================================= */}
           {/* SEÇÃO DE LISTA DE ESPERA */}
           {/* ============================================= */}
           {activeTab === 'agenda' && agendaView === 'espera' && (
              <>
                {/* Header com botão adicionar */}
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white text-lg font-bold">Lista de Espera</Text>
                  <TouchableOpacity 
                    onPress={() => setShowAddWaiting(true)}
                    className="bg-[#d4af37] px-4 py-2 rounded-xl flex-row items-center"
                  >
                    <Ionicons name="add" size={18} color="#000" />
                    <Text className="text-black font-bold ml-1">Novo</Text>
                  </TouchableOpacity>
                </View>

                {/* Modal de adicionar à lista de espera */}
                {showAddWaiting && (
                  <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mb-4">
                    <Text className="text-white font-bold text-lg mb-4">Adicionar à Lista de Espera</Text>
                    
                    {/* Nome do cliente */}
                    <Text className="text-gray-400 text-xs mb-2">Nome do Cliente *</Text>
                    <TextInput
                      value={waitingClientName}
                      onChangeText={setWaitingClientName}
                      placeholder="Nome completo"
                      placeholderTextColor="#666"
                      className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                    />

                    {/* Telefone */}
                    <Text className="text-gray-400 text-xs mb-2">Telefone (opcional)</Text>
                    <TextInput
                      value={waitingClientPhone}
                      onChangeText={setWaitingClientPhone}
                      placeholder="(11) 99999-9999"
                      placeholderTextColor="#666"
                      keyboardType="phone-pad"
                      className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                    />

                    {/* Barbeiro desejado */}
                    <Text className="text-gray-400 text-xs mb-2">Barbeiro Desejado (opcional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                      <TouchableOpacity
                        onPress={() => setWaitingBarber(null)}
                        className={`px-4 py-2 rounded-xl mr-2 ${!waitingBarber ? 'bg-[#d4af37]' : 'bg-[#121212] border border-gray-700'}`}
                      >
                        <Text className={`text-sm ${!waitingBarber ? 'text-black font-bold' : 'text-gray-400'}`}>Qualquer</Text>
                      </TouchableOpacity>
                      {barbers.map((b) => (
                        <TouchableOpacity
                          key={b.id}
                          onPress={() => setWaitingBarber(b)}
                          className={`px-4 py-2 rounded-xl mr-2 ${waitingBarber?.id === b.id ? 'bg-[#d4af37]' : 'bg-[#121212] border border-gray-700'}`}
                        >
                          <Text className={`text-sm ${waitingBarber?.id === b.id ? 'text-black font-bold' : 'text-gray-400'}`}>{b.name.split(' ')[0]}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Data desejada */}
                    <Text className="text-gray-400 text-xs mb-2">Data Desejada *</Text>
                    <TextInput
                      value={waitingDate}
                      onChangeText={setWaitingDate}
                      placeholder="AAAA-MM-DD"
                      placeholderTextColor="#666"
                      className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                    />

                    {/* Horário preferido */}
                    <Text className="text-gray-400 text-xs mb-2">Horário Preferido (opcional)</Text>
                    <View className="flex-row mb-4">
                      <View className="flex-1 mr-2">
                        <TextInput
                          value={waitingTimeStart}
                          onChangeText={setWaitingTimeStart}
                          placeholder="De (HH:MM)"
                          placeholderTextColor="#666"
                          className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700"
                        />
                      </View>
                      <View className="flex-1 ml-2">
                        <TextInput
                          value={waitingTimeEnd}
                          onChangeText={setWaitingTimeEnd}
                          placeholder="Até (HH:MM)"
                          placeholderTextColor="#666"
                          className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700"
                        />
                      </View>
                    </View>

                    {/* Botões */}
                    <View className="flex-row">
                      <TouchableOpacity 
                        onPress={() => { setShowAddWaiting(false); resetWaitingForm(); }}
                        className="flex-1 py-3 mr-2 rounded-xl border border-gray-700 items-center"
                      >
                        <Text className="text-gray-400 font-bold">Cancelar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        onPress={addToWaitingList}
                        className="flex-1 py-3 ml-2 rounded-xl bg-[#d4af37] items-center"
                      >
                        <Text className="text-black font-bold">Adicionar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Lista de espera */}
                {loadingWaitingList ? (
                  <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                ) : waitingList.length === 0 ? (
                  <View className="items-center py-16">
                    <Ionicons name="people-outline" size={64} color="#333" />
                    <Text className="text-gray-500 mt-4 text-lg font-bold">Lista vazia</Text>
                    <Text className="text-gray-600 text-center mt-2">Nenhum cliente aguardando horário</Text>
                  </View>
                ) : (
                  waitingList.map((client) => (
                    <View key={client.id} className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 overflow-hidden">
                      <View className="p-4">
                        <View className="flex-row justify-between items-start mb-2">
                          <View>
                            <Text className="text-white font-bold text-lg">{client.client_name}</Text>
                            {client.client_phone && (
                              <Text className="text-gray-400 text-sm">{client.client_phone}</Text>
                            )}
                          </View>
                          <View className="bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-700">
                            <Text className="text-yellow-400 text-xs font-bold">Aguardando</Text>
                          </View>
                        </View>

                        <View className="flex-row flex-wrap mt-2">
                          {client.barbers && (
                            <View className="flex-row items-center mr-4 mb-2">
                              <Ionicons name="person" size={14} color="#d4af37" style={{ marginRight: 4 }} />
                              <Text className="text-gray-300 text-sm">{client.barbers.name}</Text>
                            </View>
                          )}
                          {client.services && (
                            <View className="flex-row items-center mr-4 mb-2">
                              <Ionicons name="cut" size={14} color="#d4af37" style={{ marginRight: 4 }} />
                              <Text className="text-gray-300 text-sm">{client.services.name}</Text>
                            </View>
                          )}
                          <View className="flex-row items-center mb-2">
                            <Ionicons name="calendar" size={14} color="#d4af37" style={{ marginRight: 4 }} />
                            <Text className="text-gray-300 text-sm">
                              {new Date(client.preferred_date + 'T12:00:00').toLocaleDateString('pt-BR')}
                            </Text>
                          </View>
                          {client.preferred_time_start && (
                            <View className="flex-row items-center mb-2">
                              <Ionicons name="time" size={14} color="#d4af37" style={{ marginRight: 4 }} />
                              <Text className="text-gray-300 text-sm">
                                {client.preferred_time_start}{client.preferred_time_end ? ` - ${client.preferred_time_end}` : ''}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      {/* Botões de ação */}
                      <View className="flex-row border-t border-gray-800">
                        <TouchableOpacity 
                          onPress={() => notifyWaitingClient(client.id, client.client_name, client.client_phone)}
                          className="flex-1 flex-row items-center justify-center py-3 border-r border-gray-800"
                        >
                          <Ionicons name="logo-whatsapp" size={18} color="#22c55e" style={{ marginRight: 6 }} />
                          <Text className="text-green-400 font-bold text-sm">Notificar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          onPress={() => removeFromWaitingList(client.id, client.client_name)}
                          className="flex-1 flex-row items-center justify-center py-3"
                        >
                          <Ionicons name="close-circle" size={18} color="#f87171" style={{ marginRight: 6 }} />
                          <Text className="text-red-400 font-bold text-sm">Remover</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </>
           )}

           {activeTab === 'servicos' && !isEditing && (
              <>
                <TouchableOpacity onPress={() => startEditService(null)} className="bg-[#1e1e1e] border border-[#d4af37] p-4 rounded-xl items-center flex-row justify-center mb-6 mt-2">
                   <Ionicons name="add-circle-outline" size={24} color="#d4af37" className="mr-2" />
                   <Text className="text-[#d4af37] font-bold ml-2">Adicionar Novo Serviço</Text>
                </TouchableOpacity>

                {loadingServices ? <ActivityIndicator size="large" color="#d4af37" className="mt-10" /> 
                : services.map((svc) => (
                  <View key={svc.id} className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800 mb-4 flex-row justify-between items-center">
                     <View>
                        <Text className="text-white font-bold text-lg mb-1">{svc.name}</Text>
                        <Text className="text-[#d4af37] font-semibold">R$ {svc.price.toFixed(2)}  •  <Text className="text-gray-400">{svc.duration_minutes} min</Text></Text>
                     </View>
                     <View className="flex-row items-center">
                        <TouchableOpacity onPress={() => startEditService(svc)} className="p-3 bg-gray-800 rounded-lg mr-2">
                           <Ionicons name="pencil" size={20} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteService(svc.id)} className="p-3 bg-red-900/30 rounded-lg border border-red-900">
                           <Ionicons name="trash" size={20} color="#f87171" />
                        </TouchableOpacity>
                     </View>
                  </View>
                ))}
              </>
           )}

           {activeTab === 'servicos' && isEditing && (
               <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mt-2 mb-8">
                  <Text className="text-white font-bold text-xl mb-6">{editId ? 'Editar Serviço' : 'Novo Serviço'}</Text>
                  
                  <Text className="text-gray-400 text-xs mb-1">Nome do Corte / Serviço</Text>
                  <TextInput 
                     value={formName} 
                     onChangeText={setFormName} 
                     className="bg-[#121212] text-white p-4 rounded-xl border border-gray-800 mb-4" 
                     placeholder="Ex: Tonalização"
                     placeholderTextColor="#666"
                  />

                  <View className="flex-row mb-6 mt-2" style={{ gap: 16 }}>
                     <View className="flex-1 mr-4">
                        <Text className="text-gray-400 text-xs mb-1">Preço (R$)</Text>
                        <TextInput 
                           value={formPrice} 
                           onChangeText={setFormPrice} 
                           keyboardType="numeric"
                           className="bg-[#121212] text-[#d4af37] font-bold p-4 rounded-xl border border-gray-800" 
                           placeholder="30.00"
                           placeholderTextColor="#666"
                        />
                     </View>
                     <View className="flex-1">
                        <Text className="text-gray-400 text-xs mb-1">Duração (Min)</Text>
                        <TextInput 
                           value={formDuration} 
                           onChangeText={setFormDuration} 
                           keyboardType="numeric"
                           className="bg-[#121212] text-white p-4 rounded-xl border border-gray-800" 
                           placeholder="20"
                           placeholderTextColor="#666"
                        />
                     </View>
                  </View>

                  <TouchableOpacity onPress={saveService} className="bg-[#d4af37] p-4 rounded-xl items-center mb-4">
                     <Text className="text-black font-bold text-lg">Salvar Serviço na Tabela</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsEditing(false)} className="p-4 items-center">
                     <Text className="text-gray-400 font-bold">Cancelar Edição</Text>
                  </TouchableOpacity>
               </View>
           )}

            {activeTab === 'profissionais' && !isEditing && (
              <>
                {/* Botões de ação */}
                <View className="flex-row mb-4" style={{ gap: 12 }}>
                  <TouchableOpacity 
                    onPress={() => startEditBarber(null)} 
                    className="flex-1 bg-[#1e1e1e] border border-[#d4af37] p-4 rounded-xl items-center flex-row justify-center"
                  >
                    <Ionicons name="person-add-outline" size={20} color="#d4af37" />
                    <Text className="text-[#d4af37] font-bold ml-2">Novo Profissional</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => setShowAddAccount(true)}
                    className="flex-1 bg-[#1e1e1e] border border-blue-500 p-4 rounded-xl items-center flex-row justify-center"
                  >
                    <Ionicons name="key-outline" size={20} color="#3b82f6" />
                    <Text className="text-blue-400 font-bold ml-2">Criar Conta</Text>
                  </TouchableOpacity>
                </View>

                {/* Modal de Criar Conta */}
                {showAddAccount && (
                  <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-blue-500 mb-4">
                    <Text className="text-white font-bold text-xl mb-4">Criar Conta de Acesso</Text>
                    
                    {/* Selecionar Profissional */}
                    <Text className="text-gray-400 text-xs mb-2">Selecionar Profissional</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                      {barbers.map((b) => {
                        const hasAccount = barberAccounts.some(a => a.barber_id === b.id);
                        return (
                          <TouchableOpacity
                            key={b.id}
                            onPress={() => !hasAccount && setSelectedBarberForAccount(b)}
                            disabled={hasAccount}
                            className={`px-4 py-3 rounded-xl mr-2 ${hasAccount ? 'bg-gray-800 opacity-50' : selectedBarberForAccount?.id === b.id ? 'bg-blue-600' : 'bg-[#121212] border border-gray-700'}`}
                          >
                            <Text className={`text-sm ${hasAccount ? 'text-gray-600' : selectedBarberForAccount?.id === b.id ? 'text-white font-bold' : 'text-gray-400'}`}>
                              {b.name.split(' ')[0]} {hasAccount ? '✓' : ''}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {selectedBarberForAccount && (
                      <>
                        {/* Email */}
                        <Text className="text-gray-400 text-xs mb-2">Email (para login)</Text>
                        <TextInput
                          value={accountEmail}
                          onChangeText={setAccountEmail}
                          placeholder="email@exemplo.com"
                          placeholderTextColor="#666"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                        />

                        {/* Senha */}
                        <Text className="text-gray-400 text-xs mb-2">Senha Provisória</Text>
                        <TextInput
                          value={accountPassword}
                          onChangeText={setAccountPassword}
                          placeholder="Mínimo 6 caracteres"
                          placeholderTextColor="#666"
                          secureTextEntry
                          className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                        />

                        {/* Permissões */}
                        <Text className="text-gray-400 text-xs mb-2">Permissões de Acesso</Text>
                        <View className="bg-[#121212] rounded-xl p-3 mb-4">
                          {[
                            { key: 'can_view_dashboard', label: 'Dashboard', icon: 'stats-chart' },
                            { key: 'can_view_agenda', label: 'Agenda', icon: 'calendar' },
                            { key: 'can_view_clients', label: 'Clientes', icon: 'people' },
                            { key: 'can_view_finance', label: 'Financeiro', icon: 'wallet' },
                            { key: 'can_view_services', label: 'Serviços', icon: 'cut' },
                            { key: 'can_view_team', label: 'Equipe', icon: 'person' },
                          ].map((perm) => (
                            <View key={perm.key} className="flex-row items-center justify-between py-2 border-b border-gray-800">
                              <View className="flex-row items-center">
                                <Ionicons name={perm.icon as any} size={16} color="#d4af37" style={{ marginRight: 8 }} />
                                <Text className="text-gray-300 text-sm">{perm.label}</Text>
                              </View>
                              <TouchableOpacity 
                                onPress={() => setAccountPermissions(prev => ({ ...prev, [perm.key]: !prev[perm.key] }))}
                                className={`w-12 h-6 rounded-full justify-center ${accountPermissions[perm.key] ? 'bg-green-600' : 'bg-gray-600'}`}
                              >
                                <View className={`w-5 h-5 rounded-full bg-white mx-0.5 ${accountPermissions[perm.key] ? 'ml-6' : 'ml-0.5'}`} />
                              </TouchableOpacity>
                            </View>
                          ))}
                        </View>

                        {/* Botões */}
                        <View className="flex-row">
                          <TouchableOpacity 
                            onPress={() => { setShowAddAccount(false); resetAccountForm(); }}
                            className="flex-1 py-3 mr-2 rounded-xl border border-gray-700 items-center"
                          >
                            <Text className="text-gray-400 font-bold">Cancelar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={createBarberAccount}
                            className="flex-1 py-3 ml-2 rounded-xl bg-blue-600 items-center"
                          >
                            <Text className="text-white font-bold">Criar Conta</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                )}

                {/* Lista de Profissionais com Contas */}
                {loadingBarbers ? (
                  <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                ) : (
                  barbers.map((b) => {
                    const account = barberAccounts.find(a => a.barber_id === b.id);
                    const commission = barberCommissions.find(c => c.barber_id === b.id);
                    const goal = barberGoals.find(g => g.barber_id === b.id);
                    const rating = barberRatings[b.id];

                    return (
                      <View key={b.id} className="bg-[#1e1e1e] rounded-2xl border border-gray-800 mb-4 overflow-hidden">
                        {/* Header com Avatar */}
                        <View className="p-4 flex-row items-center border-b border-gray-800">
                          <Image 
                            source={{ uri: b.avatar_url || 'https://i.pravatar.cc/150' }}
                            className="w-16 h-16 rounded-full mr-4 bg-gray-700"
                          />
                          <View className="flex-1">
                            <Text className="text-white font-bold text-lg">{b.name}</Text>
                            <Text className="text-gray-400 text-sm">{b.specialty || 'Barbeiro'}</Text>
                            {/* Rating */}
                            {rating && rating.count > 0 && (
                              <View className="flex-row items-center mt-1">
                                <Ionicons name="star" size={14} color="#d4af37" />
                                <Text className="text-[#d4af37] text-sm ml-1">{rating.avg.toFixed(1)}</Text>
                                <Text className="text-gray-500 text-xs ml-1">({rating.count})</Text>
                              </View>
                            )}
                          </View>
                          {/* Botões de ação */}
                          <View className="flex-row">
                            <TouchableOpacity onPress={() => startEditBarber(b)} className="p-2 bg-gray-800 rounded-lg mr-2">
                              <Ionicons name="pencil" size={18} color="#fff" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => deleteBarber(b.id)} className="p-2 bg-red-900/30 rounded-lg">
                              <Ionicons name="trash" size={18} color="#f87171" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Conta de Acesso */}
                        <View className="p-4 border-b border-gray-800">
                          <View className="flex-row items-center justify-between mb-2">
                            <View className="flex-row items-center">
                              <Ionicons name="key" size={16} color={account ? '#22c55e' : '#666'} style={{ marginRight: 8 }} />
                              <Text className="text-gray-400 text-sm">Conta de Acesso</Text>
                            </View>
                            {account ? (
                              <View className={`px-2 py-1 rounded-full ${account.is_active ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'}`}>
                                <Text className={`text-xs font-bold ${account.is_active ? 'text-green-400' : 'text-red-400'}`}>
                                  {account.is_active ? 'Ativa' : 'Inativa'}
                                </Text>
                              </View>
                            ) : (
                              <TouchableOpacity 
                                onPress={() => { setSelectedBarberForAccount(b); setShowAddAccount(true); }}
                                className="flex-row items-center"
                              >
                                <Ionicons name="add-circle" size={16} color="#3b82f6" />
                                <Text className="text-blue-400 text-xs ml-1">Criar</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          
                          {account && (
                            <View>
                              <Text className="text-gray-500 text-xs">Email: {account.email}</Text>
                              <View className="flex-row mt-2">
                                <TouchableOpacity 
                                  onPress={() => toggleAccountStatus(account.id, account.is_active)}
                                  className={`flex-1 py-2 mr-2 rounded-lg items-center ${account.is_active ? 'bg-red-900/30 border border-red-700' : 'bg-green-900/30 border border-green-700'}`}
                                >
                                  <Text className={`text-xs font-bold ${account.is_active ? 'text-red-400' : 'text-green-400'}`}>
                                    {account.is_active ? 'Desativar' : 'Ativar'}
                                  </Text>
                                </TouchableOpacity>
                                <TouchableOpacity 
                                  onPress={() => setShowChangePassword(account.id)}
                                  className="flex-1 py-2 ml-2 rounded-lg items-center bg-[#121212] border border-gray-700"
                                >
                                  <Text className="text-gray-400 text-xs font-bold">Alterar Senha</Text>
                                </TouchableOpacity>
                              </View>

                              {/* Modal Alterar Senha */}
                              {showChangePassword === account.id && (
                                <View className="mt-3 bg-[#121212] p-4 rounded-xl">
                                  <Text className="text-gray-400 text-xs mb-2">Nova Senha</Text>
                                  <TextInput
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    placeholder="Mínimo 6 caracteres"
                                    placeholderTextColor="#666"
                                    secureTextEntry
                                    className="bg-[#1e1e1e] text-white p-3 rounded-lg border border-gray-700 mb-3"
                                  />
                                  <View className="flex-row">
                                    <TouchableOpacity 
                                      onPress={() => { setShowChangePassword(null); setNewPassword(''); }}
                                      className="flex-1 py-2 mr-2 rounded-lg border border-gray-700 items-center"
                                    >
                                      <Text className="text-gray-400">Cancelar</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                      onPress={() => changeBarberPassword(account.email)}
                                      className="flex-1 py-2 ml-2 rounded-lg bg-[#d4af37] items-center"
                                    >
                                      <Text className="text-black font-bold">Salvar</Text>
                                    </TouchableOpacity>
                                  </View>
                                </View>
                              )}
                            </View>
                          )}
                        </View>

                        {/* Comissão */}
                        <View className="p-4 border-b border-gray-800">
                          <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                              <Ionicons name="cash-outline" size={16} color="#d4af37" style={{ marginRight: 8 }} />
                              <Text className="text-gray-400 text-sm">Comissão:</Text>
                              <Text className="text-[#d4af37] font-bold ml-2">
                                {commission ? `${commission.commission_percentage}%` : 'Não configurada'}
                              </Text>
                            </View>
                            <TouchableOpacity 
                              onPress={() => {
                                setEditingCommission(editingCommission === b.id ? null : b.id);
                                setCommissionPercentage(commission?.commission_percentage?.toString() || '50');
                              }}
                            >
                              <Ionicons name="settings" size={16} color="#d4af37" />
                            </TouchableOpacity>
                          </View>
                        </View>

                        {/* Meta do Mês */}
                        {goal && (
                          <View className="p-4">
                            <Text className="text-gray-400 text-xs mb-2">Meta do Mês</Text>
                            <View className="flex-row">
                              <View className="flex-1 mr-2">
                                <Text className="text-gray-500 text-xs">Atendimentos</Text>
                                <View className="bg-gray-800 rounded-full h-2 mt-1 overflow-hidden">
                                  <View 
                                    className="h-full bg-[#d4af37] rounded-full"
                                    style={{ width: `${Math.min((goal.current_appointments / goal.target_appointments) * 100, 100)}%` }}
                                  />
                                </View>
                                <Text className="text-gray-400 text-xs mt-1">{goal.current_appointments}/{goal.target_appointments}</Text>
                              </View>
                              <View className="flex-1 ml-2">
                                <Text className="text-gray-500 text-xs">Faturamento</Text>
                                <View className="bg-gray-800 rounded-full h-2 mt-1 overflow-hidden">
                                  <View 
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${Math.min((goal.current_revenue / goal.target_revenue) * 100, 100)}%` }}
                                  />
                                </View>
                                <Text className="text-gray-400 text-xs mt-1">R$ {goal.current_revenue.toFixed(0)}/{goal.target_revenue.toFixed(0)}</Text>
                              </View>
                            </View>
                          </View>
                        )}
                      </View>
                    );
                  })
                )}
              </>
           )}

            {activeTab === 'profissionais' && isEditing && (
                <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mt-2 mb-8">
                   <Text className="text-white font-bold text-xl mb-6">{editId ? 'Editar Profissional' : 'Novo Barbeiro'}</Text>
                   
                   <Text className="text-gray-400 text-xs mb-1">Nome Completo</Text>
                   <TextInput 
                      value={formBarberName} 
                      onChangeText={setFormBarberName} 
                      className="bg-[#121212] text-white p-4 rounded-xl border border-gray-800 mb-4" 
                      placeholder="Ex: Matheus Costa"
                      placeholderTextColor="#666"
                   />

                   <Text className="text-gray-400 text-xs mb-1">Especialidade (Opcional)</Text>
                   <TextInput 
                      value={formBarberSpecialty} 
                      onChangeText={setFormBarberSpecialty} 
                      className="bg-[#121212] text-white p-4 rounded-xl border border-gray-800 mb-8" 
                      placeholder="Ex: Especialista Navalha"
                      placeholderTextColor="#666"
                   />

                   <TouchableOpacity onPress={saveBarber} className="bg-[#d4af37] p-4 rounded-xl items-center mb-4">
                      <Text className="text-black font-bold text-lg">Salvar Barbeiro na Equipe</Text>
                   </TouchableOpacity>
                   <TouchableOpacity onPress={() => setIsEditing(false)} className="p-4 items-center">
                      <Text className="text-gray-400 font-bold">Cancelar Edição</Text>
                   </TouchableOpacity>
                </View>
            )}

            {activeTab === 'relatorios' && (
               <View className="items-center justify-center py-20">
                  <Ionicons name="document-text-outline" size={64} color="#333" />
                  <Text className="text-gray-500 mt-4 text-lg font-bold">Em breve</Text>
                  <Text className="text-gray-600 text-center mt-2">Funcionalidade de relatórios será implantada futuramente.</Text>
               </View>
            )}

            {activeTab === 'financeiro' && (
               <>
                 {/* Seletor Previsão / Realizado */}
                 <View className="flex-row mb-4" style={{ gap: 12 }}>
                   <TouchableOpacity 
                     onPress={() => setFinanceViewMode('previsao')}
                     className={`flex-1 py-3 rounded-xl items-center ${financeViewMode === 'previsao' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <View className="flex-row items-center">
                       <Ionicons name="trending-up" size={18} color={financeViewMode === 'previsao' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                       <Text className={`font-bold ${financeViewMode === 'previsao' ? 'text-black' : 'text-gray-400'}`}>Previsão</Text>
                     </View>
                     <Text className={`text-xs mt-1 ${financeViewMode === 'previsao' ? 'text-black/70' : 'text-gray-600'}`}>Agendamentos futuros</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => setFinanceViewMode('realizado')}
                     className={`flex-1 py-3 rounded-xl items-center ${financeViewMode === 'realizado' ? 'bg-green-600' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <View className="flex-row items-center">
                       <Ionicons name="checkmark-done" size={18} color={financeViewMode === 'realizado' ? '#fff' : '#22c55e'} style={{ marginRight: 6 }} />
                       <Text className={`font-bold ${financeViewMode === 'realizado' ? 'text-white' : 'text-gray-400'}`}>Realizado</Text>
                     </View>
                     <Text className={`text-xs mt-1 ${financeViewMode === 'realizado' ? 'text-white/70' : 'text-gray-600'}`}>Serviços concluídos</Text>
                   </TouchableOpacity>
                 </View>

                 {/* Atalhos de Período */}
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2 mb-4">
                   <TouchableOpacity 
                     onPress={() => { setFinanceFilter('hoje'); setShowDatePicker(false); }}
                     className={`px-4 py-2 rounded-xl mr-2 ${financeFilter === 'hoje' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <Text className={`font-bold text-sm ${financeFilter === 'hoje' ? 'text-black' : 'text-gray-400'}`}>Hoje</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => { setFinanceFilter('15dias'); setShowDatePicker(false); }}
                     className={`px-4 py-2 rounded-xl mr-2 ${financeFilter === '15dias' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <Text className={`font-bold text-sm ${financeFilter === '15dias' ? 'text-black' : 'text-gray-400'}`}>15 Dias</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => { setFinanceFilter('30dias'); setShowDatePicker(false); }}
                     className={`px-4 py-2 rounded-xl mr-2 ${financeFilter === '30dias' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <Text className={`font-bold text-sm ${financeFilter === '30dias' ? 'text-black' : 'text-gray-400'}`}>30 Dias</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => { setFinanceFilter('60dias'); setShowDatePicker(false); }}
                     className={`px-4 py-2 rounded-xl mr-2 ${financeFilter === '60dias' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <Text className={`font-bold text-sm ${financeFilter === '60dias' ? 'text-black' : 'text-gray-400'}`}>60 Dias</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => { setFinanceFilter('custom'); setShowDatePicker(true); }}
                     className={`px-4 py-2 rounded-xl mr-2 ${financeFilter === 'custom' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'} flex-row items-center`}
                   >
                     <Ionicons name="calendar" size={16} color={financeFilter === 'custom' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                     <Text className={`font-bold text-sm ${financeFilter === 'custom' ? 'text-black' : 'text-gray-400'}`}>Filtrar</Text>
                   </TouchableOpacity>
                 </ScrollView>

                 {/* Período Selecionado */}
                 <View className="bg-[#1e1e1e] p-3 rounded-xl border border-gray-800 mb-4">
                   <Text className="text-gray-500 text-xs">Período Selecionado</Text>
                   <Text className="text-[#d4af37] font-bold">{getFilterLabel(financeFilter)}</Text>
                 </View>

                 {/* Modal de Filtro Personalizado */}
                 {showDatePicker && (
                   <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-[#d4af37] mb-4">
                     <Text className="text-white font-bold text-lg mb-4">Período Personalizado</Text>
                     
                     {/* Data Início */}
                     <TouchableOpacity 
                       onPress={() => setSelectingField('start')}
                       className={`p-4 rounded-xl border mb-3 ${selectingField === 'start' ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-gray-700'}`}
                     >
                       <Text className="text-gray-500 text-xs">Data Início</Text>
                       <Text className="text-white font-bold">{customStart ? new Date(customStart + 'T12:00:00').toLocaleDateString('pt-BR') : 'Selecionar'}</Text>
                     </TouchableOpacity>
                     
                     {/* Data Fim */}
                     <TouchableOpacity 
                       onPress={() => setSelectingField('end')}
                       className={`p-4 rounded-xl border mb-4 ${selectingField === 'end' ? 'border-[#d4af37] bg-[#d4af37]/10' : 'border-gray-700'}`}
                     >
                       <Text className="text-gray-500 text-xs">Data Fim</Text>
                       <Text className="text-white font-bold">{customEnd ? new Date(customEnd + 'T12:00:00').toLocaleDateString('pt-BR') : 'Selecionar'}</Text>
                     </TouchableOpacity>

                     {/* Mini Calendário */}
                     <View className="bg-[#121212] rounded-xl p-4 mb-4">
                       <View className="flex-row justify-between items-center mb-4">
                         <TouchableOpacity onPress={() => {
                           if (selectingField === 'start') {
                             setCustomStartMonth(prev => prev === 0 ? 11 : prev - 1);
                             if (customStartMonth === 0) setCustomStartYear(prev => prev - 1);
                           } else {
                             setCustomEndMonth(prev => prev === 0 ? 11 : prev - 1);
                             if (customEndMonth === 0) setCustomEndYear(prev => prev - 1);
                           }
                         }}>
                           <Ionicons name="chevron-back" size={24} color="#d4af37" />
                         </TouchableOpacity>
                         <Text className="text-white font-bold">
                           {selectingField === 'start' 
                             ? new Date(customStartYear, customStartMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                             : new Date(customEndYear, customEndMonth).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                           }
                         </Text>
                         <TouchableOpacity onPress={() => {
                           if (selectingField === 'start') {
                             setCustomStartMonth(prev => prev === 11 ? 0 : prev + 1);
                             if (customStartMonth === 11) setCustomStartYear(prev => prev + 1);
                           } else {
                             setCustomEndMonth(prev => prev === 11 ? 0 : prev + 1);
                             if (customEndMonth === 11) setCustomEndYear(prev => prev + 1);
                           }
                         }}>
                           <Ionicons name="chevron-forward" size={24} color="#d4af37" />
                         </TouchableOpacity>
                       </View>
                       
                       {/* Dias do mês */}
                       <View className="flex-row flex-wrap justify-between">
                         {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
                           const year = selectingField === 'start' ? customStartYear : customEndYear;
                           const month = selectingField === 'start' ? customStartMonth : customEndMonth;
                           const maxDays = new Date(year, month + 1, 0).getDate();
                           
                           if (day > maxDays) return null;
                           
                           const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                           const isSelected = (selectingField === 'start' ? customStart : customEnd) === dateStr;
                           const today = new Date();
                           const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                           
                           return (
                             <TouchableOpacity
                               key={day}
                               onPress={() => {
                                 if (selectingField === 'start') setCustomStart(dateStr);
                                 else setCustomEnd(dateStr);
                               }}
                               className={`w-10 h-10 rounded-lg items-center justify-center mb-2 ${isSelected ? 'bg-[#d4af37]' : isToday ? 'border border-[#d4af37]' : ''}`}
                             >
                               <Text className={`text-sm font-semibold ${isSelected ? 'text-black' : 'text-gray-400'}`}>{day}</Text>
                             </TouchableOpacity>
                           );
                         })}
                       </View>
                     </View>

                     {/* Botões */}
                     <View className="flex-row" style={{ gap: 12 }}>
                       <TouchableOpacity 
                         onPress={() => { setShowDatePicker(false); setFinanceFilter('hoje'); }}
                         className="flex-1 py-3 rounded-xl border border-gray-700 items-center"
                       >
                         <Text className="text-gray-400 font-bold">Cancelar</Text>
                       </TouchableOpacity>
                       <TouchableOpacity 
                         onPress={() => { 
                           if (customStart && customEnd) {
                             setShowDatePicker(false); 
                             fetchFinanceData();
                           } else {
                             Alert.alert('Atenção', 'Selecione as datas de início e fim');
                           }
                         }}
                         className="flex-1 py-3 rounded-xl bg-[#d4af37] items-center"
                       >
                         <Text className="text-black font-bold">Aplicar</Text>
                       </TouchableOpacity>
                     </View>
                   </View>
                 )}

                 {/* Sub-tabs do Financeiro */}
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                   <TouchableOpacity 
                     onPress={() => setFinanceSubTab('resultado')}
                     className={`px-4 py-2 rounded-xl mr-2 ${financeSubTab === 'resultado' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <Text className={`font-bold text-sm ${financeSubTab === 'resultado' ? 'text-black' : 'text-gray-400'}`}>Resultado</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => setFinanceSubTab('receitas')}
                     className={`px-4 py-2 rounded-xl mr-2 ${financeSubTab === 'receitas' ? 'bg-green-900/50 border border-green-600' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <Text className={`font-bold text-sm ${financeSubTab === 'receitas' ? 'text-green-400' : 'text-gray-400'}`}>Receitas</Text>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => setFinanceSubTab('despesas')}
                     className={`px-4 py-2 rounded-xl mr-2 ${financeSubTab === 'despesas' ? 'bg-red-900/50 border border-red-600' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <Text className={`font-bold text-sm ${financeSubTab === 'despesas' ? 'text-red-400' : 'text-gray-400'}`}>Despesas</Text>
                   </TouchableOpacity>
                 </ScrollView>

                 {/* Dados baseados no modo selecionado */}
                 {(() => {
                   const currentData = financeViewMode === 'previsao' ? financeData : financeRealData;
                   return (
                 <>
                 {loadingFinance ? (
                   <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                 ) : (
                   <>
                      {/* Card de Resultado */}
                      {financeSubTab === 'resultado' && (
                        <View className="mb-4">
                          <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mb-4">
                            <Text className="text-gray-400 text-sm mb-1">Resultado Líquido ({financeViewMode === 'previsao' ? 'Previsão' : 'Realizado'})</Text>
                            <Text className={`text-3xl font-bold ${currentData.receitas - currentData.despesas >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              R$ {(currentData.receitas - currentData.despesas).toFixed(2)}
                            </Text>
                          </View>
                          <View className="flex-row" style={{ gap: 12 }}>
                            <View className="flex-1 bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
                              <Ionicons name="trending-up" size={24} color="#22c55e" style={{ marginBottom: 8 }} />
                              <Text className="text-gray-400 text-xs">Receitas</Text>
                              <Text className="text-green-400 font-bold text-lg">R$ {currentData.receitas.toFixed(2)}</Text>
                            </View>
                            <View className="flex-1 bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
                              <Ionicons name="trending-down" size={24} color="#ef4444" style={{ marginBottom: 8 }} />
                              <Text className="text-gray-400 text-xs">Despesas</Text>
                              <Text className="text-red-400 font-bold text-lg">R$ {currentData.despesas.toFixed(2)}</Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {/* Lista de Receitas */}
                      {financeSubTab === 'receitas' && (
                        <View>
                          <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-white font-bold text-lg">Receitas</Text>
                            <Text className="text-green-400 font-bold">R$ {currentData.receitas.toFixed(2)}</Text>
                          </View>
                          {currentData.transacoes.filter((t: any) => t.tipo === 'receita').length === 0 ? (
                            <View className="items-center py-10">
                              <Ionicons name="receipt-outline" size={48} color="#333" />
                              <Text className="text-gray-500 mt-2">Nenhuma receita no período</Text>
                            </View>
                          ) : (
                            currentData.transacoes.filter((t: any) => t.tipo === 'receita').map((t: any) => (
                              <View key={t.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mb-3 flex-row justify-between items-center">
                                <View className="flex-1">
                                  <Text className="text-white font-semibold">{t.client}</Text>
                                  <Text className="text-gray-500 text-xs">{t.service} • {new Date(t.date).toLocaleDateString('pt-BR')}</Text>
                                  {financeViewMode === 'previsao' && t.status === 'confirmed' && (
                                    <Text className="text-yellow-500 text-xs mt-1">Pendente</Text>
                                  )}
                                </View>
                                <Text className="text-green-400 font-bold">+ R$ {t.valor.toFixed(2)}</Text>
                              </View>
                            ))
                          )}
                        </View>
                      )}

                      {/* Lista de Despesas */}
                      {financeSubTab === 'despesas' && (
                        <View>
                          <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-white font-bold text-lg">Despesas</Text>
                            <Text className="text-red-400 font-bold">R$ {currentData.despesas.toFixed(2)}</Text>
                          </View>
                          {currentData.transacoes.filter((t: any) => t.tipo === 'despesa').length === 0 ? (
                            <View className="items-center py-10">
                              <Ionicons name="receipt-outline" size={48} color="#333" />
                              <Text className="text-gray-500 mt-2">Nenhuma despesa no período</Text>
                            </View>
                          ) : (
                            currentData.transacoes.filter((t: any) => t.tipo === 'despesa').map((t: any) => (
                              <View key={t.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mb-3 flex-row justify-between items-center">
                                <View className="flex-1">
                                  <Text className="text-white font-semibold">{t.service}</Text>
                                  <Text className="text-gray-500 text-xs">{new Date(t.date).toLocaleDateString('pt-BR')}</Text>
                                </View>
                                <Text className="text-red-400 font-bold">- R$ {t.valor.toFixed(2)}</Text>
                              </View>
                            ))
                          )}
                        </View>
                      )}
                    </>
                  )}
                  </>
                  );
                })()}
               </>
            )}

            {activeTab === 'mensalistas' && (
               <>
                 {/* Header com botão adicionar */}
                 <View className="flex-row justify-between items-center mb-4">
                   <Text className="text-white text-lg font-bold">Mensalistas</Text>
                   <TouchableOpacity 
                     onPress={() => setShowAddSubscription(true)}
                     className="bg-[#d4af37] px-4 py-2 rounded-xl flex-row items-center"
                   >
                     <Ionicons name="add" size={18} color="#000" />
                     <Text className="text-black font-bold ml-1">Novo</Text>
                   </TouchableOpacity>
                 </View>

                 {/* Campo de busca */}
                 <View className="bg-[#1e1e1e] flex-row items-center px-4 py-3 rounded-xl border border-gray-800 mb-4">
                   <Ionicons name="search" size={20} color="#666" style={{ marginRight: 10 }} />
                   <TextInput
                     value={subscriptionSearch}
                     onChangeText={setSubscriptionSearch}
                     placeholder="Buscar mensalista..."
                     placeholderTextColor="#666"
                     className="flex-1 text-white"
                   />
                   {subscriptionSearch.length > 0 && (
                     <TouchableOpacity onPress={() => setSubscriptionSearch('')}>
                       <Ionicons name="close-circle" size={20} color="#666" />
                     </TouchableOpacity>
                   )}
                 </View>

                 {/* Modal de adicionar mensalista */}
                 {showAddSubscription && (
                   <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mb-4">
                     <Text className="text-white font-bold text-lg mb-4">Cadastrar Mensalista</Text>
                     
                     {/* Selecionar cliente */}
                     <Text className="text-gray-400 text-xs mb-2">Selecionar Cliente</Text>
                     <ScrollView 
                       horizontal 
                       showsHorizontalScrollIndicator={false}
                       className="mb-4"
                     >
                       {subscriptionClients.map((client) => (
                         <TouchableOpacity
                           key={client.id}
                           onPress={() => setSelectedClient(client)}
                           className={`px-4 py-2 rounded-xl mr-2 ${selectedClient?.id === client.id ? 'bg-[#d4af37]' : 'bg-[#121212] border border-gray-700'}`}
                         >
                           <Text className={`text-sm ${selectedClient?.id === client.id ? 'text-black font-bold' : 'text-gray-400'}`}>
                             {client.full_name.split(' ')[0]}
                           </Text>
                         </TouchableOpacity>
                       ))}
                     </ScrollView>

                     {selectedClient && (
                       <View className="bg-[#121212] p-3 rounded-xl mb-4">
                         <Text className="text-[#d4af37] font-bold">{selectedClient.full_name}</Text>
                         <Text className="text-gray-400 text-sm">{selectedClient.phone || 'Sem telefone'}</Text>
                       </View>
                     )}

                     {/* Quantidade de cortes */}
                     <Text className="text-gray-400 text-xs mb-2">Quantidade de Cortes</Text>
                     <View className="flex-row mb-4">
                       {['4', '8', '12', '16'].map((num) => (
                         <TouchableOpacity
                           key={num}
                           onPress={() => setSubscriptionCuts(num)}
                           className={`flex-1 py-3 mr-2 rounded-xl ${subscriptionCuts === num ? 'bg-[#d4af37]' : 'bg-[#121212] border border-gray-700'}`}
                         >
                           <Text className={`text-center font-bold ${subscriptionCuts === num ? 'text-black' : 'text-gray-400'}`}>{num}</Text>
                         </TouchableOpacity>
                       ))}
                     </View>

                     {/* Preço (opcional) */}
                     <Text className="text-gray-400 text-xs mb-2">Valor Mensal (R$) - Opcional</Text>
                     <TextInput
                       value={subscriptionPrice}
                       onChangeText={setSubscriptionPrice}
                       placeholder="Ex: 150.00"
                       placeholderTextColor="#666"
                       keyboardType="numeric"
                       className="bg-[#121212] text-[#d4af37] font-bold p-4 rounded-xl border border-gray-700 mb-4"
                     />

                     {/* Botões */}
                     <View className="flex-row">
                       <TouchableOpacity 
                         onPress={() => { setShowAddSubscription(false); setSelectedClient(null); }}
                         className="flex-1 py-3 mr-2 rounded-xl border border-gray-700 items-center"
                       >
                         <Text className="text-gray-400 font-bold">Cancelar</Text>
                       </TouchableOpacity>
                       <TouchableOpacity 
                         onPress={addSubscription}
                         className="flex-1 py-3 ml-2 rounded-xl bg-[#d4af37] items-center"
                       >
                         <Text className="text-black font-bold">Cadastrar</Text>
                       </TouchableOpacity>
                     </View>
                   </View>
                 )}

                 {/* Lista de mensalistas */}
                 {loadingSubscriptions ? (
                   <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                 ) : subscriptions.length === 0 ? (
                   <View className="items-center py-16">
                     <Ionicons name="card-outline" size={64} color="#333" />
                     <Text className="text-gray-500 mt-4 text-lg font-bold">Nenhum mensalista</Text>
                     <Text className="text-gray-600 text-center mt-2">Cadastre clientes como mensalistas</Text>
                   </View>
                 ) : subscriptions
                     .filter(sub => 
                       subscriptionSearch 
                         ? sub.profiles?.full_name?.toLowerCase().includes(subscriptionSearch.toLowerCase())
                         : true
                     )
                     .map((sub) => {
                   const remaining = sub.total_cuts - sub.used_cuts;
                   const percentage = (sub.used_cuts / sub.total_cuts) * 100;
                   const isLow = remaining <= 1;
                   const isExpired = sub.status !== 'active';

                   return (
                     <View key={sub.id} className={`bg-[#1e1e1e] rounded-2xl border ${isExpired ? 'border-red-900' : isLow ? 'border-yellow-700' : 'border-gray-800'} mb-4 overflow-hidden`}>
                       {/* Header */}
                       <View className="p-4 border-b border-gray-800">
                         <View className="flex-row justify-between items-start">
                           <View className="flex-1">
                             <Text className="text-[#d4af37] font-bold text-lg">{sub.profiles?.full_name || 'Cliente'}</Text>
                             <Text className="text-gray-400 text-sm">{sub.profiles?.phone || 'Sem telefone'}</Text>
                           </View>
                           <View className={`px-3 py-1 rounded-full ${isExpired ? 'bg-red-900/30 border border-red-700' : isLow ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-green-900/30 border border-green-700'}`}>
                             <Text className={`text-xs font-bold ${isExpired ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-green-400'}`}>
                               {isExpired ? 'Expirado' : isLow ? 'Último corte!' : 'Ativo'}
                             </Text>
                           </View>
                         </View>
                       </View>

                       {/* Progresso */}
                       <View className="p-4 border-b border-gray-800">
                         <View className="flex-row justify-between mb-2">
                           <Text className="text-gray-400 text-xs">Cortes utilizados</Text>
                           <Text className="text-white font-bold">{sub.used_cuts} / {sub.total_cuts}</Text>
                         </View>
                         <View className="bg-gray-800 rounded-full h-3 overflow-hidden">
                           <View 
                             className={`h-full rounded-full ${isExpired ? 'bg-red-600' : isLow ? 'bg-yellow-600' : 'bg-[#d4af37]'}`}
                             style={{ width: `${percentage}%` }}
                           />
                         </View>
                         <Text className={`text-right mt-2 font-bold ${isExpired ? 'text-red-400' : isLow ? 'text-yellow-400' : 'text-[#d4af37]'}`}>
                           {remaining} {remaining === 1 ? 'corte restante' : 'cortes restantes'}
                         </Text>
                       </View>

                       {/* Info adicional */}
                       <View className="flex-row p-4 border-b border-gray-800">
                         <View className="flex-1">
                           <Text className="text-gray-500 text-xs">Início</Text>
                           <Text className="text-white">{new Date(sub.start_date).toLocaleDateString('pt-BR')}</Text>
                         </View>
                         {sub.price && (
                           <View className="flex-1 items-end">
                             <Text className="text-gray-500 text-xs">Valor Mensal</Text>
                             <Text className="text-[#d4af37] font-bold">R$ {sub.price.toFixed(2)}</Text>
                           </View>
                         )}
                       </View>

                       {/* Botões de ação */}
                       <View className="flex-row p-3">
                         <TouchableOpacity 
                           onPress={() => fetchUsageHistory(sub.id)}
                           className="flex-1 flex-row items-center justify-center py-3 mr-2 rounded-xl bg-[#121212] border border-gray-700"
                         >
                           <Ionicons name="time-outline" size={16} color="#d4af37" style={{ marginRight: 6 }} />
                           <Text className="text-[#d4af37] font-bold text-sm">Histórico</Text>
                         </TouchableOpacity>
                         {remaining <= 0 || isExpired ? (
                           <TouchableOpacity 
                             onPress={() => {
                               Alert.prompt(
                                 'Renovar Assinatura',
                                 'Quantidade de cortes:',
                                 [{ text: 'Cancelar', style: 'cancel' }, { text: 'Renovar', onPress: (cuts) => cuts && renewSubscription(sub.id, cuts) }],
                                 'plain-text',
                                 '4'
                               );
                             }}
                             className="flex-1 flex-row items-center justify-center py-3 ml-2 rounded-xl bg-green-900/30 border border-green-700"
                           >
                             <Ionicons name="refresh" size={16} color="#22c55e" style={{ marginRight: 6 }} />
                             <Text className="text-green-400 font-bold text-sm">Renovar</Text>
                           </TouchableOpacity>
                         ) : (
                           <TouchableOpacity 
                             onPress={() => cancelSubscription(sub.id)}
                             className="flex-1 flex-row items-center justify-center py-3 ml-2 rounded-xl bg-red-900/30 border border-red-700"
                           >
                             <Ionicons name="close-circle" size={16} color="#f87171" style={{ marginRight: 6 }} />
                             <Text className="text-red-400 font-bold text-sm">Cancelar</Text>
                           </TouchableOpacity>
                         )}
                       </View>

                       {/* Modal de histórico */}
                       {showUsageHistory === sub.id && (
                         <View className="bg-[#121212] p-4 border-t border-gray-800">
                           <View className="flex-row justify-between items-center mb-3">
                             <Text className="text-white font-bold">Histórico de Uso</Text>
                             <TouchableOpacity onPress={() => setShowUsageHistory(null)}>
                               <Ionicons name="close" size={20} color="#666" />
                             </TouchableOpacity>
                           </View>
                           {usageHistory.length === 0 ? (
                             <Text className="text-gray-500 text-sm">Nenhum uso registrado ainda</Text>
                           ) : (
                             usageHistory.map((usage, idx) => (
                               <View key={idx} className="flex-row items-center py-2 border-b border-gray-800">
                                 <Ionicons name="cut" size={14} color="#d4af37" style={{ marginRight: 8 }} />
                                 <View className="flex-1">
                                   <Text className="text-white text-sm">{usage.service_name || 'Serviço'}</Text>
                                   <Text className="text-gray-500 text-xs">
                                     {new Date(usage.used_at).toLocaleDateString('pt-BR')} às {new Date(usage.used_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                   </Text>
                                 </View>
                                 {usage.barber_name && (
                                   <Text className="text-gray-400 text-xs">{usage.barber_name}</Text>
                                 )}
                               </View>
                             ))
                           )}
                         </View>
                       )}
                     </View>
                   );
                  })}
                </>
            )}

            {/* ============================================= */}
            {/* SEÇÃO DE CAIXA E COMISSÕES */}
            {/* ============================================= */}
            {activeTab === 'caixa' && (
               <>
                 {/* Sub-tabs: Caixa e Comissões */}
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                   <View className="flex-row">
                     <View className="bg-[#d4af37] px-4 py-2 rounded-xl mr-2">
                       <Text className="text-black font-bold text-sm">Caixa</Text>
                     </View>
                     <View className="bg-[#1e1e1e] border border-gray-800 px-4 py-2 rounded-xl">
                       <Text className="text-gray-400 font-bold text-sm">Comissões</Text>
                     </View>
                   </View>
                 </ScrollView>

                 {/* STATUS DO CAIXA */}
                 {loadingCash ? (
                   <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                 ) : !currentCashRegister ? (
                   /* CAIXA FECHADO - Botão para abrir */
                   <View className="bg-[#1e1e1e] p-6 rounded-2xl border border-gray-800 items-center">
                     <Ionicons name="lock-closed" size={64} color="#666" style={{ marginBottom: 16 }} />
                     <Text className="text-white text-xl font-bold mb-2">Caixa Fechado</Text>
                     <Text className="text-gray-400 text-center mb-6">Abra o caixa para iniciar as operações do dia</Text>
                     
                     <Text className="text-gray-400 text-xs mb-2 self-start">Saldo Inicial (R$)</Text>
                     <TextInput
                       value={openingBalance}
                       onChangeText={setOpeningBalance}
                       placeholder="0.00"
                       placeholderTextColor="#666"
                       keyboardType="numeric"
                       className="bg-[#121212] text-[#d4af37] font-bold text-2xl p-4 rounded-xl border border-gray-700 w-full text-center mb-4"
                     />
                     
                     <TouchableOpacity 
                       onPress={openCashRegister}
                       className="bg-green-600 py-4 px-8 rounded-xl w-full items-center"
                     >
                       <View className="flex-row items-center">
                         <Ionicons name="lock-open" size={24} color="#fff" style={{ marginRight: 8 }} />
                         <Text className="text-white font-bold text-lg">Abrir Caixa</Text>
                       </View>
                     </TouchableOpacity>
                   </View>
                 ) : (
                   /* CAIXA ABERTO */
                   <>
                     {/* Resumo do Caixa */}
                     <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-green-700 mb-4">
                       <View className="flex-row items-center justify-between mb-4">
                         <View className="flex-row items-center">
                           <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                           <Text className="text-green-400 font-bold">CAIXA ABERTO</Text>
                         </View>
                         <Text className="text-gray-400 text-xs">
                           {new Date(currentCashRegister.open_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                         </Text>
                       </View>

                       {/* Cards de Saldo */}
                       <View className="flex-row mb-4" style={{ gap: 12 }}>
                         <View className="flex-1 bg-[#121212] p-4 rounded-xl">
                           <Text className="text-gray-500 text-xs">Abertura</Text>
                           <Text className="text-white font-bold">R$ {currentCashRegister.opening_balance.toFixed(2)}</Text>
                         </View>
                         <View className="flex-1 bg-[#121212] p-4 rounded-xl">
                           <Text className="text-gray-500 text-xs">Entradas</Text>
                           <Text className="text-green-400 font-bold">+ R$ {currentCashRegister.total_revenue.toFixed(2)}</Text>
                         </View>
                         <View className="flex-1 bg-[#121212] p-4 rounded-xl">
                           <Text className="text-gray-500 text-xs">Saídas</Text>
                           <Text className="text-red-400 font-bold">- R$ {currentCashRegister.total_expenses.toFixed(2)}</Text>
                         </View>
                       </View>

                       {/* Saldo Esperado */}
                       <View className="bg-[#d4af37] p-4 rounded-xl">
                         <Text className="text-black text-xs">Saldo Esperado</Text>
                         <Text className="text-black text-2xl font-bold">R$ {currentCashRegister.expected_balance.toFixed(2)}</Text>
                       </View>
                     </View>

                     {/* Botões de Ação */}
                     <View className="flex-row mb-4" style={{ gap: 12 }}>
                       <TouchableOpacity 
                         onPress={() => setShowAddMovement(true)}
                         className="flex-1 bg-[#1e1e1e] border border-gray-700 p-4 rounded-xl items-center"
                       >
                         <Ionicons name="add-circle" size={24} color="#d4af37" />
                         <Text className="text-gray-400 text-sm mt-1">Movimentação</Text>
                       </TouchableOpacity>
                       <TouchableOpacity 
                         onPress={() => {
                           Alert.prompt(
                             'Fechar Caixa',
                             `Saldo esperado: R$ ${currentCashRegister.expected_balance.toFixed(2)}\n\nInforme o saldo em caixa:`,
                             [
                               { text: 'Cancelar', style: 'cancel' },
                               { text: 'Fechar', onPress: (value) => { setClosingBalance(value || '0'); closeCashRegister(); } }
                             ],
                             'plain-text',
                             currentCashRegister.expected_balance.toString()
                           );
                         }}
                         className="flex-1 bg-red-900/30 border border-red-700 p-4 rounded-xl items-center"
                       >
                         <Ionicons name="lock-closed" size={24} color="#f87171" />
                         <Text className="text-red-400 text-sm mt-1">Fechar Caixa</Text>
                       </TouchableOpacity>
                     </View>

                     {/* Modal de Adicionar Movimentação */}
                     {showAddMovement && (
                       <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mb-4">
                         <Text className="text-white font-bold text-lg mb-4">Nova Movimentação</Text>
                         
                         {/* Tipo: Entrada ou Saída */}
                         <View className="flex-row mb-4">
                           <TouchableOpacity 
                             onPress={() => setCashMovementType('income')}
                             className={`flex-1 py-3 rounded-l-xl items-center ${cashMovementType === 'income' ? 'bg-green-600' : 'bg-[#121212] border border-gray-700'}`}
                           >
                             <Text className={`font-bold ${cashMovementType === 'income' ? 'text-white' : 'text-gray-400'}`}>Entrada</Text>
                           </TouchableOpacity>
                           <TouchableOpacity 
                             onPress={() => setCashMovementType('expense')}
                             className={`flex-1 py-3 rounded-r-xl items-center ${cashMovementType === 'expense' ? 'bg-red-600' : 'bg-[#121212] border border-gray-700'}`}
                           >
                             <Text className={`font-bold ${cashMovementType === 'expense' ? 'text-white' : 'text-gray-400'}`}>Saída</Text>
                           </TouchableOpacity>
                         </View>

                         {/* Descrição */}
                         <Text className="text-gray-400 text-xs mb-2">Descrição</Text>
                         <TextInput
                           value={cashMovementDesc}
                           onChangeText={setCashMovementDesc}
                           placeholder="Ex: Pagamento de serviço, Troco, Despesa..."
                           placeholderTextColor="#666"
                           className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                         />

                         {/* Valor */}
                         <Text className="text-gray-400 text-xs mb-2">Valor (R$)</Text>
                         <TextInput
                           value={cashMovementAmount}
                           onChangeText={setCashMovementAmount}
                           placeholder="0.00"
                           placeholderTextColor="#666"
                           keyboardType="numeric"
                           className="bg-[#121212] text-[#d4af37] font-bold p-4 rounded-xl border border-gray-700 mb-4"
                         />

                         {/* Botões */}
                         <View className="flex-row">
                           <TouchableOpacity 
                             onPress={() => { setShowAddMovement(false); setCashMovementDesc(''); setCashMovementAmount(''); }}
                             className="flex-1 py-3 mr-2 rounded-xl border border-gray-700 items-center"
                           >
                             <Text className="text-gray-400 font-bold">Cancelar</Text>
                           </TouchableOpacity>
                           <TouchableOpacity 
                             onPress={addCashMovement}
                             className="flex-1 py-3 ml-2 rounded-xl bg-[#d4af37] items-center"
                           >
                             <Text className="text-black font-bold">Registrar</Text>
                           </TouchableOpacity>
                         </View>
                       </View>
                     )}

                     {/* Lista de Movimentações */}
                     <Text className="text-white font-bold text-lg mb-3">Movimentações do Dia</Text>
                     {cashMovements.length === 0 ? (
                       <View className="items-center py-8">
                         <Ionicons name="document-text-outline" size={40} color="#333" />
                         <Text className="text-gray-500 mt-2">Nenhuma movimentação ainda</Text>
                       </View>
                     ) : (
                       cashMovements.map((mov) => (
                         <View key={mov.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mb-2 flex-row items-center">
                           <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${mov.type === 'income' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                             <Ionicons 
                               name={mov.type === 'income' ? 'arrow-down' : 'arrow-up'} 
                               size={20} 
                               color={mov.type === 'income' ? '#22c55e' : '#f87171'} 
                             />
                           </View>
                           <View className="flex-1">
                             <Text className="text-white font-semibold">{mov.description}</Text>
                             <Text className="text-gray-500 text-xs">
                               {new Date(mov.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                             </Text>
                           </View>
                           <Text className={`font-bold ${mov.type === 'income' ? 'text-green-400' : 'text-red-400'}`}>
                             {mov.type === 'income' ? '+' : '-'} R$ {mov.amount.toFixed(2)}
                           </Text>
                         </View>
                       ))
                     )}

                     {/* Seção de Comissões */}
                     <View className="mt-6 pt-6 border-t border-gray-800">
                       <Text className="text-white font-bold text-lg mb-3">Comissões do Mês</Text>
                       {barberCommissions.length === 0 ? (
                         <View className="items-center py-8">
                           <Ionicons name="people-outline" size={40} color="#333" />
                           <Text className="text-gray-500 mt-2">Configure as comissões na aba Equipe</Text>
                         </View>
                       ) : (
                         barberCommissions.map((bc) => {
                           const pendingComm = commissionRecords
                             .filter(r => r.barber_id === bc.barber_id && r.status === 'pending')
                             .reduce((sum, r) => sum + r.commission_amount, 0);
                           const paidComm = commissionRecords
                             .filter(r => r.barber_id === bc.barber_id && r.status === 'paid')
                             .reduce((sum, r) => sum + r.commission_amount, 0);

                           return (
                             <View key={bc.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mb-3">
                               <View className="flex-row justify-between items-center mb-2">
                                 <Text className="text-white font-bold">{bc.barbers?.name || 'Barbeiro'}</Text>
                                 <Text className="text-[#d4af37]">{bc.commission_percentage}%</Text>
                               </View>
                               <View className="flex-row justify-between">
                                 <View>
                                   <Text className="text-gray-500 text-xs">Pendente</Text>
                                   <Text className="text-yellow-400 font-bold">R$ {pendingComm.toFixed(2)}</Text>
                                 </View>
                                 <View>
                                   <Text className="text-gray-500 text-xs">Pago</Text>
                                   <Text className="text-green-400 font-bold">R$ {paidComm.toFixed(2)}</Text>
                                 </View>
                                 {pendingComm > 0 && (
                                   <TouchableOpacity 
                                     onPress={() => markCommissionsAsPaid(bc.barber_id)}
                                     className="bg-green-600 px-3 py-1 rounded-lg"
                                   >
                                     <Text className="text-white text-xs font-bold">Pagar</Text>
                                   </TouchableOpacity>
                                 )}
                               </View>
                             </View>
                           );
                         })
                       )}
                     </View>
                   </>
                 )}
               </>
            )}

            {/* ============================================= */}
            {/* ABA MAIS - Indicações, Estoque, Fidelidade, Link */}
            {/* ============================================= */}
            {activeTab === 'mais' && (
               <>
                 {/* Sub-tabs */}
                 <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                   <TouchableOpacity 
                     onPress={() => setMaisSubTab('indicacoes')}
                     className={`px-4 py-3 rounded-xl mr-2 ${maisSubTab === 'indicacoes' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <View className="flex-row items-center">
                       <Ionicons name="people" size={16} color={maisSubTab === 'indicacoes' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                       <Text className={`font-bold text-sm ${maisSubTab === 'indicacoes' ? 'text-black' : 'text-gray-400'}`}>Indicações</Text>
                     </View>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => setMaisSubTab('estoque')}
                     className={`px-4 py-3 rounded-xl mr-2 ${maisSubTab === 'estoque' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <View className="flex-row items-center">
                       <Ionicons name="cube" size={16} color={maisSubTab === 'estoque' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                       <Text className={`font-bold text-sm ${maisSubTab === 'estoque' ? 'text-black' : 'text-gray-400'}`}>Estoque</Text>
                     </View>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => setMaisSubTab('fidelidade')}
                     className={`px-4 py-3 rounded-xl mr-2 ${maisSubTab === 'fidelidade' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <View className="flex-row items-center">
                       <Ionicons name="star" size={16} color={maisSubTab === 'fidelidade' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                       <Text className={`font-bold text-sm ${maisSubTab === 'fidelidade' ? 'text-black' : 'text-gray-400'}`}>Fidelidade</Text>
                     </View>
                   </TouchableOpacity>
                   <TouchableOpacity 
                     onPress={() => setMaisSubTab('link')}
                     className={`px-4 py-3 rounded-xl mr-2 ${maisSubTab === 'link' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                   >
                     <View className="flex-row items-center">
                       <Ionicons name="link" size={16} color={maisSubTab === 'link' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                       <Text className={`font-bold text-sm ${maisSubTab === 'link' ? 'text-black' : 'text-gray-400'}`}>Link Online</Text>
                     </View>
                   </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setMaisSubTab('permissoes')}
                      className={`px-4 py-3 rounded-xl mr-2 ${maisSubTab === 'permissoes' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="shield-checkmark" size={16} color={maisSubTab === 'permissoes' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                        <Text className={`font-bold text-sm ${maisSubTab === 'permissoes' ? 'text-black' : 'text-gray-400'}`}>Permissões</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => setMaisSubTab('chat')}
                      className={`px-4 py-3 rounded-xl mr-2 ${maisSubTab === 'chat' ? 'bg-[#d4af37]' : 'bg-[#1e1e1e] border border-gray-800'}`}
                    >
                      <View className="flex-row items-center">
                        <Ionicons name="chatbubbles" size={16} color={maisSubTab === 'chat' ? '#000' : '#d4af37'} style={{ marginRight: 6 }} />
                        <Text className={`font-bold text-sm ${maisSubTab === 'chat' ? 'text-black' : 'text-gray-400'}`}>Chat</Text>
                      </View>
                    </TouchableOpacity>
                 </ScrollView>

                 {/* INDICAÇÕES */}
                 {maisSubTab === 'indicacoes' && (
                   <>
                     <View className="flex-row justify-between items-center mb-4">
                       <Text className="text-white text-lg font-bold">Indicações</Text>
                       <TouchableOpacity 
                         onPress={() => setShowAddReferral(true)}
                         className="bg-[#d4af37] px-4 py-2 rounded-xl flex-row items-center"
                       >
                         <Ionicons name="add" size={18} color="#000" />
                         <Text className="text-black font-bold ml-1">Nova</Text>
                       </TouchableOpacity>
                     </View>

                     {showAddReferral && (
                       <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mb-4">
                         <Text className="text-white font-bold text-lg mb-4">Registrar Indicação</Text>
                         <TextInput
                           value={referralName}
                           onChangeText={setReferralName}
                           placeholder="Nome do indicado"
                           placeholderTextColor="#666"
                           className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                         />
                         <TextInput
                           value={referralPhone}
                           onChangeText={setReferralPhone}
                           placeholder="Telefone (opcional)"
                           placeholderTextColor="#666"
                           keyboardType="phone-pad"
                           className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                         />
                         <View className="flex-row">
                           <TouchableOpacity onPress={() => { setShowAddReferral(false); setReferralName(''); setReferralPhone(''); }} className="flex-1 py-3 mr-2 rounded-xl border border-gray-700 items-center">
                             <Text className="text-gray-400 font-bold">Cancelar</Text>
                           </TouchableOpacity>
                           <TouchableOpacity onPress={addReferral} className="flex-1 py-3 ml-2 rounded-xl bg-[#d4af37] items-center">
                             <Text className="text-black font-bold">Salvar</Text>
                           </TouchableOpacity>
                         </View>
                       </View>
                     )}

                     {loadingReferrals ? (
                       <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                     ) : referrals.length === 0 ? (
                       <View className="items-center py-16">
                         <Ionicons name="people-outline" size={64} color="#333" />
                         <Text className="text-gray-500 mt-4">Nenhuma indicação registrada</Text>
                       </View>
                     ) : (
                       referrals.map((ref) => (
                         <View key={ref.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mb-3">
                           <View className="flex-row justify-between items-start">
                             <View>
                               <Text className="text-white font-bold">{ref.referred_name}</Text>
                               <Text className="text-gray-400 text-sm">Indicado por: {ref.profiles?.full_name || 'N/A'}</Text>
                               {ref.referred_phone && <Text className="text-gray-500 text-xs">{ref.referred_phone}</Text>}
                             </View>
                             <View className={`px-3 py-1 rounded-full ${ref.status === 'completed' ? 'bg-green-900/30 border border-green-700' : 'bg-yellow-900/30 border border-yellow-700'}`}>
                               <Text className={`text-xs font-bold ${ref.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                                 {ref.status === 'completed' ? 'Completado' : 'Pendente'}
                               </Text>
                             </View>
                           </View>
                           {ref.status === 'pending' && (
                             <TouchableOpacity onPress={() => completeReferral(ref.id)} className="mt-3 bg-green-900/30 border border-green-700 py-2 rounded-lg items-center">
                               <Text className="text-green-400 font-bold text-sm">Marcar como Completado</Text>
                             </TouchableOpacity>
                           )}
                         </View>
                       ))
                     )}
                   </>
                 )}

                 {/* ESTOQUE */}
                 {maisSubTab === 'estoque' && (
                   <>
                     <View className="flex-row justify-between items-center mb-4">
                       <Text className="text-white text-lg font-bold">Estoque</Text>
                       <TouchableOpacity 
                         onPress={() => { setShowAddProduct(true); setEditingProduct(null); resetProductForm(); }}
                         className="bg-[#d4af37] px-4 py-2 rounded-xl flex-row items-center"
                       >
                         <Ionicons name="add" size={18} color="#000" />
                         <Text className="text-black font-bold ml-1">Novo</Text>
                       </TouchableOpacity>
                     </View>

                     {/* Alerta de estoque baixo */}
                     {products.filter(p => p.stock_quantity <= p.min_stock).length > 0 && (
                       <View className="bg-yellow-900/20 border border-yellow-700 p-4 rounded-xl mb-4">
                         <View className="flex-row items-center">
                           <Ionicons name="warning" size={20} color="#eab308" style={{ marginRight: 8 }} />
                           <Text className="text-yellow-400 font-bold">
                             {products.filter(p => p.stock_quantity <= p.min_stock).length} produto(s) com estoque baixo!
                           </Text>
                         </View>
                       </View>
                     )}

                     {showAddProduct && (
                       <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mb-4">
                         <Text className="text-white font-bold text-lg mb-4">{editingProduct ? 'Editar' : 'Novo'} Produto</Text>
                         <TextInput value={productName} onChangeText={setProductName} placeholder="Nome do produto" placeholderTextColor="#666" className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-3" />
                         <TextInput value={productCategory} onChangeText={setProductCategory} placeholder="Categoria (ex: Pomada, Shampoo)" placeholderTextColor="#666" className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-3" />
                         <View className="flex-row mb-3">
                           <TextInput value={productCostPrice} onChangeText={setProductCostPrice} placeholder="Custo R$" placeholderTextColor="#666" keyboardType="numeric" className="flex-1 bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mr-2" />
                           <TextInput value={productSalePrice} onChangeText={setProductSalePrice} placeholder="Venda R$" placeholderTextColor="#666" keyboardType="numeric" className="flex-1 bg-[#121212] text-white p-4 rounded-xl border border-gray-700 ml-2" />
                         </View>
                         <View className="flex-row mb-4">
                           <TextInput value={productStock} onChangeText={setProductStock} placeholder="Qtd estoque" placeholderTextColor="#666" keyboardType="numeric" className="flex-1 bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mr-2" />
                           <TextInput value={productMinStock} onChangeText={setProductMinStock} placeholder="Mínimo" placeholderTextColor="#666" keyboardType="numeric" className="flex-1 bg-[#121212] text-white p-4 rounded-xl border border-gray-700 ml-2" />
                         </View>
                         <View className="flex-row">
                           <TouchableOpacity onPress={() => { setShowAddProduct(false); setEditingProduct(null); }} className="flex-1 py-3 mr-2 rounded-xl border border-gray-700 items-center">
                             <Text className="text-gray-400 font-bold">Cancelar</Text>
                           </TouchableOpacity>
                           <TouchableOpacity onPress={saveProduct} className="flex-1 py-3 ml-2 rounded-xl bg-[#d4af37] items-center">
                             <Text className="text-black font-bold">Salvar</Text>
                           </TouchableOpacity>
                         </View>
                       </View>
                     )}

                     {loadingProducts ? (
                       <ActivityIndicator size="large" color="#d4af37" className="mt-10" />
                     ) : products.length === 0 ? (
                       <View className="items-center py-16">
                         <Ionicons name="cube-outline" size={64} color="#333" />
                         <Text className="text-gray-500 mt-4">Nenhum produto cadastrado</Text>
                       </View>
                     ) : (
                       products.map((prod) => (
                         <View key={prod.id} className={`bg-[#1e1e1e] rounded-xl border ${prod.stock_quantity <= prod.min_stock ? 'border-yellow-700' : 'border-gray-800'} mb-3 overflow-hidden`}>
                           <View className="p-4">
                             <View className="flex-row justify-between items-start mb-2">
                               <View className="flex-1">
                                 <Text className="text-white font-bold">{prod.name}</Text>
                                 <Text className="text-gray-400 text-sm">{prod.category || 'Sem categoria'}</Text>
                               </View>
                               <View className={`px-3 py-1 rounded-full ${prod.stock_quantity <= prod.min_stock ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-green-900/30 border border-green-700'}`}>
                                 <Text className={`text-xs font-bold ${prod.stock_quantity <= prod.min_stock ? 'text-yellow-400' : 'text-green-400'}`}>
                                   {prod.stock_quantity} {prod.unit || 'un'}
                                 </Text>
                               </View>
                             </View>
                             <View className="flex-row justify-between">
                               <Text className="text-gray-500 text-sm">Custo: R$ {prod.cost_price?.toFixed(2) || '0.00'}</Text>
                               <Text className="text-[#d4af37] font-bold">Venda: R$ {prod.sale_price?.toFixed(2) || '0.00'}</Text>
                             </View>
                           </View>
                           <View className="flex-row border-t border-gray-800">
                             <TouchableOpacity onPress={() => setShowStockMovement(prod.id)} className="flex-1 py-3 items-center border-r border-gray-800">
                               <Text className="text-[#d4af37] font-bold text-sm">Movimentar</Text>
                             </TouchableOpacity>
                             <TouchableOpacity onPress={() => startEditProduct(prod)} className="flex-1 py-3 items-center border-r border-gray-800">
                               <Text className="text-gray-400 font-bold text-sm">Editar</Text>
                             </TouchableOpacity>
                             <TouchableOpacity onPress={() => deleteProduct(prod.id)} className="flex-1 py-3 items-center">
                               <Text className="text-red-400 font-bold text-sm">Excluir</Text>
                             </TouchableOpacity>
                           </View>
                           {showStockMovement === prod.id && (
                             <View className="bg-[#121212] p-4 border-t border-gray-800">
                               <View className="flex-row mb-3">
                                 <TouchableOpacity onPress={() => setStockMovementType('entry')} className={`flex-1 py-2 rounded-l-lg ${stockMovementType === 'entry' ? 'bg-green-600' : 'bg-[#1e1e1e]'}`}>
                                   <Text className={`text-center text-sm font-bold ${stockMovementType === 'entry' ? 'text-white' : 'text-gray-400'}`}>Entrada</Text>
                                 </TouchableOpacity>
                                 <TouchableOpacity onPress={() => setStockMovementType('exit')} className={`flex-1 py-2 ${stockMovementType === 'exit' ? 'bg-red-600' : 'bg-[#1e1e1e]'}`}>
                                   <Text className={`text-center text-sm font-bold ${stockMovementType === 'exit' ? 'text-white' : 'text-gray-400'}`}>Saída</Text>
                                 </TouchableOpacity>
                                 <TouchableOpacity onPress={() => setStockMovementType('sale')} className={`flex-1 py-2 rounded-r-lg ${stockMovementType === 'sale' ? 'bg-blue-600' : 'bg-[#1e1e1e]'}`}>
                                   <Text className={`text-center text-sm font-bold ${stockMovementType === 'sale' ? 'text-white' : 'text-gray-400'}`}>Venda</Text>
                                 </TouchableOpacity>
                               </View>
                               <TextInput value={stockMovementQty} onChangeText={setStockMovementQty} placeholder="Quantidade" placeholderTextColor="#666" keyboardType="numeric" className="bg-[#1e1e1e] text-white p-3 rounded-lg border border-gray-700 mb-3" />
                               <TextInput value={stockMovementReason} onChangeText={setStockMovementReason} placeholder="Motivo (opcional)" placeholderTextColor="#666" className="bg-[#1e1e1e] text-white p-3 rounded-lg border border-gray-700 mb-3" />
                               <View className="flex-row">
                                 <TouchableOpacity onPress={() => setShowStockMovement(null)} className="flex-1 py-2 mr-2 rounded-lg border border-gray-700 items-center">
                                   <Text className="text-gray-400">Cancelar</Text>
                                 </TouchableOpacity>
                                 <TouchableOpacity onPress={() => registerStockMovement(prod.id)} className="flex-1 py-2 ml-2 rounded-lg bg-[#d4af37] items-center">
                                   <Text className="text-black font-bold">Confirmar</Text>
                                 </TouchableOpacity>
                               </View>
                             </View>
                           )}
                         </View>
                       ))
                     )}
                   </>
                 )}

                 {/* FIDELIDADE */}
                 {maisSubTab === 'fidelidade' && (
                   <>
                     <View className="flex-row justify-between items-center mb-4">
                       <Text className="text-white text-lg font-bold">Programa de Fidelidade</Text>
                       <TouchableOpacity 
                         onPress={() => setShowAddReward(true)}
                         className="bg-[#d4af37] px-4 py-2 rounded-xl flex-row items-center"
                       >
                         <Ionicons name="add" size={18} color="#000" />
                         <Text className="text-black font-bold ml-1">Recompensa</Text>
                       </TouchableOpacity>
                     </View>

                     {/* Top Clientes */}
                     <Text className="text-gray-400 text-sm mb-3">Top Clientes com Mais Pontos</Text>
                     {topLoyaltyClients.length > 0 && (
                       <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
                         {topLoyaltyClients.slice(0, 5).map((client, idx) => (
                           <View key={client.id} className="bg-[#1e1e1e] p-4 rounded-xl mr-3 items-center" style={{ minWidth: 100 }}>
                             <Text className="text-[#d4af37] text-2xl font-bold">#{idx + 1}</Text>
                             <Text className="text-white text-sm mt-1">{client.profiles?.full_name?.split(' ')[0] || 'Cliente'}</Text>
                             <Text className="text-[#d4af37] font-bold">{client.points} pts</Text>
                           </View>
                         ))}
                       </ScrollView>
                     )}

                     {showAddReward && (
                       <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-[#d4af37] mb-4">
                         <Text className="text-white font-bold text-lg mb-4">Nova Recompensa</Text>
                         <TextInput value={rewardName} onChangeText={setRewardName} placeholder="Nome da recompensa" placeholderTextColor="#666" className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-3" />
                         <TextInput value={rewardDescription} onChangeText={setRewardDescription} placeholder="Descrição (opcional)" placeholderTextColor="#666" className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-3" />
                         <TextInput value={rewardPointsCost} onChangeText={setRewardPointsCost} placeholder="Custo em pontos" placeholderTextColor="#666" keyboardType="numeric" className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4" />
                         <View className="flex-row">
                           <TouchableOpacity onPress={() => { setShowAddReward(false); setRewardName(''); setRewardDescription(''); setRewardPointsCost(''); }} className="flex-1 py-3 mr-2 rounded-xl border border-gray-700 items-center">
                             <Text className="text-gray-400 font-bold">Cancelar</Text>
                           </TouchableOpacity>
                           <TouchableOpacity onPress={addLoyaltyReward} className="flex-1 py-3 ml-2 rounded-xl bg-[#d4af37] items-center">
                             <Text className="text-black font-bold">Salvar</Text>
                           </TouchableOpacity>
                         </View>
                       </View>
                     )}

                     <Text className="text-gray-400 text-sm mb-3">Recompensas Disponíveis</Text>
                     {loyaltyRewards.length === 0 ? (
                       <View className="items-center py-8">
                         <Ionicons name="gift-outline" size={40} color="#333" />
                         <Text className="text-gray-500 mt-2">Nenhuma recompensa cadastrada</Text>
                       </View>
                     ) : (
                       loyaltyRewards.map((reward) => (
                         <View key={reward.id} className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800 mb-3 flex-row items-center justify-between">
                           <View className="flex-1">
                             <Text className="text-white font-bold">{reward.name}</Text>
                             {reward.description && <Text className="text-gray-400 text-sm">{reward.description}</Text>}
                           </View>
                           <View className="flex-row items-center">
                             <View className="bg-[#d4af37] px-3 py-1 rounded-full mr-3">
                               <Text className="text-black font-bold text-sm">{reward.points_cost} pts</Text>
                             </View>
                             <TouchableOpacity onPress={() => deleteLoyaltyReward(reward.id)}>
                               <Ionicons name="trash-outline" size={20} color="#f87171" />
                             </TouchableOpacity>
                           </View>
                         </View>
                       ))
                     )}
                   </>
                 )}

                 {/* LINK ONLINE */}
                 {maisSubTab === 'link' && (
                   <>
                     <Text className="text-white text-lg font-bold mb-4">Agendamento Online</Text>
                     
                     <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-4">
                       <View className="flex-row items-center justify-between mb-4">
                         <View className="flex-row items-center">
                           <Ionicons name="globe" size={24} color="#d4af37" style={{ marginRight: 12 }} />
                           <View>
                             <Text className="text-white font-bold">Link Público</Text>
                             <Text className="text-gray-400 text-sm">Compartilhe para seus clientes agendarem</Text>
                           </View>
                         </View>
                         <TouchableOpacity 
                           onPress={() => setOnlineEnabled(!onlineEnabled)}
                           className={`w-14 h-8 rounded-full ${onlineEnabled ? 'bg-green-600' : 'bg-gray-600'} justify-center`}
                         >
                           <View className={`w-6 h-6 rounded-full bg-white mx-1 ${onlineEnabled ? 'ml-7' : 'ml-1'}`} />
                         </TouchableOpacity>
                       </View>

                       {onlineEnabled && (
                         <>
                           <TouchableOpacity 
                             onPress={copyBookingLink}
                             className="bg-[#121212] p-4 rounded-xl border border-gray-700 flex-row items-center justify-between mb-4"
                           >
                             <Text className="text-[#d4af37]">https://barbershop-app.com/book</Text>
                             <Ionicons name="copy" size={20} color="#d4af37" />
                           </TouchableOpacity>

                           <Text className="text-gray-400 text-xs mb-2">Nome da Barbearia</Text>
                           <TextInput
                             value={onlineSalonName}
                             onChangeText={setOnlineSalonName}
                             placeholder="Nome da barbearia"
                             placeholderTextColor="#666"
                             className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-3"
                           />

                           <Text className="text-gray-400 text-xs mb-2">Telefone</Text>
                           <TextInput
                             value={onlineSalonPhone}
                             onChangeText={setOnlineSalonPhone}
                             placeholder="(11) 99999-9999"
                             placeholderTextColor="#666"
                             keyboardType="phone-pad"
                             className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-3"
                           />

                           <Text className="text-gray-400 text-xs mb-2">Endereço</Text>
                           <TextInput
                             value={onlineSalonAddress}
                             onChangeText={setOnlineSalonAddress}
                             placeholder="Rua, número, bairro"
                             placeholderTextColor="#666"
                             className="bg-[#121212] text-white p-4 rounded-xl border border-gray-700 mb-4"
                           />

                           <TouchableOpacity 
                             onPress={saveOnlineConfig}
                             className="bg-[#d4af37] py-4 rounded-xl items-center"
                           >
                             <Text className="text-black font-bold">Salvar Configurações</Text>
                           </TouchableOpacity>
                         </>
                       )}
                     </View>

                     <View className="bg-[#1e1e1e] p-4 rounded-xl border border-gray-800">
                       <Text className="text-gray-400 text-sm mb-2">Como funciona:</Text>
                       <View className="flex-row items-center mb-2">
                         <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{ marginRight: 8 }} />
                         <Text className="text-gray-300 text-sm">Cliente acessa o link no navegador</Text>
                       </View>
                       <View className="flex-row items-center mb-2">
                         <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{ marginRight: 8 }} />
                         <Text className="text-gray-300 text-sm">Escolhe serviço, barbeiro e horário</Text>
                       </View>
                       <View className="flex-row items-center mb-2">
                         <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{ marginRight: 8 }} />
                         <Text className="text-gray-300 text-sm">Agendamento aparece no painel</Text>
                       </View>
                       <View className="flex-row items-center">
                         <Ionicons name="checkmark-circle" size={16} color="#22c55e" style={{ marginRight: 8 }} />
                         <Text className="text-gray-300 text-sm">Cliente recebe confirmação</Text>
                       </View>
                     </View>
                   </>
                 )}

                 {/* PERMISSÕES */}
                 {maisSubTab === 'permissoes' && (
                   <>
                     <Text className="text-white text-lg font-bold mb-4">Gerenciar Permissões</Text>
                     
                     <View className="bg-[#1e1e1e] p-5 rounded-2xl border border-gray-800 mb-4">
                       <View className="flex-row items-center mb-4">
                         <Ionicons name="shield-checkmark" size={24} color="#d4af37" style={{ marginRight: 12 }} />
                         <View>
                           <Text className="text-white font-bold">Permissões do Barbeiro</Text>
                           <Text className="text-gray-400 text-sm">Configure o que barbeiros podem acessar</Text>
                         </View>
                       </View>

                       {/* Lista de permissões para barbeiro */}
                       {[
                         { key: 'can_view_dashboard', label: 'Ver Dashboard', icon: 'stats-chart' },
                         { key: 'can_view_agenda', label: 'Ver Agenda', icon: 'calendar' },
                         { key: 'can_edit_appointments', label: 'Editar Agendamentos', icon: 'create' },
                         { key: 'can_view_clients', label: 'Ver Clientes', icon: 'people' },
                         { key: 'can_edit_clients', label: 'Editar Clientes', icon: 'person-add' },
                         { key: 'can_view_services', label: 'Ver Serviços', icon: 'cut' },
                         { key: 'can_edit_services', label: 'Editar Serviços', icon: 'create' },
                         { key: 'can_view_team', label: 'Ver Equipe', icon: 'person' },
                         { key: 'can_view_finance', label: 'Ver Financeiro', icon: 'wallet' },
                         { key: 'can_view_commissions', label: 'Ver Comissões', icon: 'cash' },
                         { key: 'can_view_cash_register', label: 'Ver Caixa', icon: 'calculator' },
                         { key: 'can_view_subscriptions', label: 'Ver Mensalistas', icon: 'card' },
                         { key: 'can_view_settings', label: 'Ver Configurações', icon: 'settings' },
                       ].map((perm) => (
                         <View key={perm.key} className="flex-row items-center justify-between py-3 border-b border-gray-800">
                           <View className="flex-row items-center">
                             <Ionicons name={perm.icon as any} size={20} color="#d4af37" style={{ marginRight: 12 }} />
                             <Text className="text-white">{perm.label}</Text>
                           </View>
                           <TouchableOpacity 
                             onPress={async () => {
                               const newValue = !permissions[perm.key];
                               const newPerms = { ...permissions, [perm.key]: newValue };
                               setPermissions(newPerms);
                               await updateRolePermissions('barber', newPerms);
                             }}
                             className={`w-14 h-8 rounded-full justify-center ${permissions[perm.key] ? 'bg-green-600' : 'bg-gray-600'}`}
                           >
                             <View className={`w-6 h-6 rounded-full bg-white mx-1 ${permissions[perm.key] ? 'ml-7' : 'ml-1'}`} />
                           </TouchableOpacity>
                         </View>
                       ))}

                       <View className="mt-4 p-3 bg-[#121212] rounded-xl">
                         <Text className="text-gray-400 text-xs">
                           ⚠️ Estas configurações se aplicam a todos os barbeiros funcionários
                         </Text>
                       </View>
                     </View>

                     {/* Info sobre roles */}
                     <View className="bg-[#1e1e1e] p-4 rounded-2xl border border-gray-800">
                       <Text className="text-white font-bold mb-3">Roles do Sistema</Text>
                       <View className="flex-row items-center mb-3">
                         <View className="bg-[#d4af37] px-3 py-1 rounded-full mr-3">
                           <Text className="text-black font-bold text-xs">Admin</Text>
                         </View>
                         <Text className="text-gray-400 flex-1">Acesso total ao sistema</Text>
                       </View>
                       <View className="flex-row items-center mb-3">
                         <View className="bg-gray-600 px-3 py-1 rounded-full mr-3">
                           <Text className="text-white font-bold text-xs">Barbeiro</Text>
                         </View>
                         <Text className="text-gray-400 flex-1">Acesso limitado (configurável)</Text>
                       </View>
                       <View className="flex-row items-center">
                         <View className="bg-gray-800 px-3 py-1 rounded-full mr-3">
                           <Text className="text-gray-400 font-bold text-xs">Cliente</Text>
                         </View>
                         <Text className="text-gray-400 flex-1">Apenas app de agendamento</Text>
                       </View>
                     </View>
                   </>
                 )}
               </>
            )}
         </ScrollView>
       </KeyboardAvoidingView>
     </SafeAreaView>
   );
 }
