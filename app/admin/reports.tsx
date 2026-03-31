/**
 * Tela de Relatórios Avançados
 * 
 * Descrição: Gráficos detalhados de faturamento, clientes e barbeiros
 * Parâmetros: Nenhum (acessa via admin)
 * Tabelas utilizadas: appointments, services, barbers, profiles, payment_transactions
 * Logs: [RELATORIOS]
 */

import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const LOG_PREFIX = '[RELATORIOS]';
const { width } = Dimensions.get('window');

export default function ReportsScreen() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('week');
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [barberPerformance, setBarberPerformance] = useState<any[]>([]);
  const [clientStats, setClientStats] = useState<any>({
    total: 0,
    newThisMonth: 0,
    returning: 0,
  });
  const [summary, setSummary] = useState<any>({
    totalRevenue: 0,
    totalAppointments: 0,
    avgTicket: 0,
    occupancyRate: 0,
  });

  useEffect(() => {
    console.log(`${LOG_PREFIX} Tela de relatórios carregada`);
    loadReports();
  }, [period]);

  const loadReports = async () => {
    setLoading(true);
    console.log(`${LOG_PREFIX} Carregando relatórios para período:`, period);

    try {
      const now = new Date();
      let startDate: Date;
      
      switch (period) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      const startDateStr = startDate.toISOString();

      // Buscar agendamentos do período
      const { data: appointments } = await supabase
        .from('appointments')
        .select('*, services(name, price), barbers(name)')
        .gte('appointment_date', startDateStr)
        .in('status', ['confirmed', 'completed']);

      if (appointments) {
        console.log(`${LOG_PREFIX} Agendamentos encontrados:`, appointments.length);

        // Calcular faturamento
        const totalRevenue = appointments.reduce((sum, appt) => sum + (appt.services?.price || 0), 0);
        const avgTicket = appointments.length > 0 ? totalRevenue / appointments.length : 0;
        
        setSummary({
          totalRevenue,
          totalAppointments: appointments.length,
          avgTicket,
          occupancyRate: Math.min(100, (appointments.length / 100) * 100),
        });

        // Faturamento por dia
        const revenueByDay: Record<string, number> = {};
        appointments.forEach(appt => {
          const day = new Date(appt.appointment_date).toLocaleDateString('pt-BR', { 
            weekday: 'short', 
            day: '2-digit' 
          });
          revenueByDay[day] = (revenueByDay[day] || 0) + (appt.services?.price || 0);
        });
        setRevenueData(Object.entries(revenueByDay).map(([day, value]) => ({ day, value })));

        // Top serviços
        const serviceCount: Record<string, { count: number; revenue: number }> = {};
        appointments.forEach(appt => {
          const name = appt.services?.name || 'Desconhecido';
          if (!serviceCount[name]) {
            serviceCount[name] = { count: 0, revenue: 0 };
          }
          serviceCount[name].count++;
          serviceCount[name].revenue += appt.services?.price || 0;
        });
        setTopServices(
          Object.entries(serviceCount)
            .map(([name, data]) => ({ name, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5)
        );

        // Performance por barbeiro
        const barberStats: Record<string, { count: number; revenue: number; name: string }> = {};
        appointments.forEach(appt => {
          const barberName = appt.barbers?.name || 'Desconhecido';
          if (!barberStats[barberName]) {
            barberStats[barberName] = { count: 0, revenue: 0, name: barberName };
          }
          barberStats[barberName].count++;
          barberStats[barberName].revenue += appt.services?.price || 0;
        });
        setBarberPerformance(
          Object.values(barberStats).sort((a, b) => b.revenue - a.revenue)
        );
      }

      // Estatísticas de clientes
      const { data: totalClients } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'client');

      const { data: newClients } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('role', 'client')
        .gte('created_at', startDateStr);

      setClientStats({
        total: totalClients?.length || 0,
        newThisMonth: newClients?.length || 0,
        returning: (totalClients?.length || 0) - (newClients?.length || 0),
      });

    } catch (error: any) {
      console.log(`${LOG_PREFIX} Erro ao carregar relatórios:`, error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSummary = () => (
    <View className="mb-6">
      <Text className="text-white font-bold text-lg mb-4">Resumo do Período</Text>
      <View className="flex-row flex-wrap justify-between">
        <View className="bg-[#1e1e1e] p-4 rounded-2xl w-[48%] mb-3">
          <Text className="text-gray-400 text-xs">Faturamento</Text>
          <Text className="text-[#d4af37] font-bold text-xl">
            R$ {summary.totalRevenue.toFixed(2)}
          </Text>
        </View>
        <View className="bg-[#1e1e1e] p-4 rounded-2xl w-[48%] mb-3">
          <Text className="text-gray-400 text-xs">Agendamentos</Text>
          <Text className="text-white font-bold text-xl">{summary.totalAppointments}</Text>
        </View>
        <View className="bg-[#1e1e1e] p-4 rounded-2xl w-[48%] mb-3">
          <Text className="text-gray-400 text-xs">Ticket Médio</Text>
          <Text className="text-white font-bold text-xl">
            R$ {summary.avgTicket.toFixed(2)}
          </Text>
        </View>
        <View className="bg-[#1e1e1e] p-4 rounded-2xl w-[48%] mb-3">
          <Text className="text-gray-400 text-xs">Ocupação</Text>
          <Text className="text-green-400 font-bold text-xl">{summary.occupancyRate.toFixed(0)}%</Text>
        </View>
      </View>
    </View>
  );

  const renderRevenueChart = () => (
    <View className="bg-[#1e1e1e] p-4 rounded-2xl mb-6">
      <Text className="text-white font-bold mb-4">Faturamento por Dia</Text>
      {revenueData.length > 0 ? (
        <View className="flex-row items-end justify-between" style={{ height: 150 }}>
          {revenueData.map((item, idx) => {
            const maxValue = Math.max(...revenueData.map(d => d.value));
            const height = maxValue > 0 ? (item.value / maxValue) * 120 : 0;
            return (
              <View key={idx} className="items-center flex-1">
                <Text className="text-[#d4af37] text-xs mb-1">
                  R$ {item.value.toFixed(0)}
                </Text>
                <View 
                  className="bg-[#d4af37] rounded-t-lg w-6"
                  style={{ height: Math.max(height, 4) }}
                />
                <Text className="text-gray-400 text-xs mt-2">{item.day}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <Text className="text-gray-500 text-center py-8">Sem dados para o período</Text>
      )}
    </View>
  );

  const renderTopServices = () => (
    <View className="bg-[#1e1e1e] p-4 rounded-2xl mb-6">
      <Text className="text-white font-bold mb-4">Top Serviços</Text>
      {topServices.map((service, idx) => (
        <View key={idx} className="flex-row justify-between items-center py-2 border-b border-gray-800">
          <View className="flex-row items-center">
            <Text className="text-[#d4af37] font-bold mr-3">#{idx + 1}</Text>
            <Text className="text-white">{service.name}</Text>
          </View>
          <Text className="text-[#d4af37] font-bold">
            R$ {service.revenue.toFixed(2)} ({service.count}x)
          </Text>
        </View>
      ))}
    </View>
  );

  const renderBarberPerformance = () => (
    <View className="bg-[#1e1e1e] p-4 rounded-2xl mb-6">
      <Text className="text-white font-bold mb-4">Performance dos Barbeiros</Text>
      {barberPerformance.map((barber, idx) => (
        <View key={idx} className="mb-3">
          <View className="flex-row justify-between mb-1">
            <Text className="text-white">{barber.name}</Text>
            <Text className="text-[#d4af37]">R$ {barber.revenue.toFixed(2)}</Text>
          </View>
          <View className="bg-gray-800 h-2 rounded-full">
            <View 
              className="bg-[#d4af37] h-2 rounded-full"
              style={{ 
                width: barberPerformance.length > 0 
                  ? `${(barber.revenue / barberPerformance[0].revenue) * 100}%` 
                  : '0%' 
              }}
            />
          </View>
          <Text className="text-gray-500 text-xs mt-1">{barber.count} atendimentos</Text>
        </View>
      ))}
    </View>
  );

  const renderClientStats = () => (
    <View className="bg-[#1e1e1e] p-4 rounded-2xl mb-6">
      <Text className="text-white font-bold mb-4">Estatísticas de Clientes</Text>
      <View className="flex-row justify-between py-2 border-b border-gray-800">
        <Text className="text-gray-400">Total de Clientes</Text>
        <Text className="text-white font-bold">{clientStats.total}</Text>
      </View>
      <View className="flex-row justify-between py-2 border-b border-gray-800">
        <Text className="text-gray-400">Novos no Período</Text>
        <Text className="text-green-400 font-bold">+{clientStats.newThisMonth}</Text>
      </View>
      <View className="flex-row justify-between py-2">
        <Text className="text-gray-400">Clientes Recorrentes</Text>
        <Text className="text-[#d4af37] font-bold">{clientStats.returning}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#121212] items-center justify-center">
        <ActivityIndicator size="large" color="#d4af37" />
        <Text className="text-gray-400 mt-4">Carregando relatórios...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#121212]" edges={['top', 'bottom']}>
      <ScrollView className="flex-1 px-4">
        <View className="flex-row items-center mt-4 mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-3 -ml-3 mr-3">
            <Ionicons name="arrow-back" size={32} color="#d4af37" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold">Relatórios</Text>
        </View>

        {/* Filtro de Período */}
        <View className="flex-row mb-6">
          {[
            { key: 'week', label: '7 dias' },
            { key: 'month', label: 'Mês' },
            { key: 'custom', label: '30 dias' },
          ].map(item => (
            <TouchableOpacity
              key={item.key}
              onPress={() => setPeriod(item.key as any)}
              className={`flex-1 py-2 rounded-lg mr-2 ${
                period === item.key ? 'bg-[#d4af37]' : 'bg-[#1e1e1e]'
              }`}
            >
              <Text className={`text-center font-bold ${
                period === item.key ? 'text-black' : 'text-white'
              }`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderSummary()}
        {renderRevenueChart()}
        {renderTopServices()}
        {renderBarberPerformance()}
        {renderClientStats()}
      </ScrollView>
    </SafeAreaView>
  );
}
