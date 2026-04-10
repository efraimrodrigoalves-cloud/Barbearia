import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

/**
 * Layout das Abas (Tabs)
 * Controla quais abas aparecem baseado no role do usuário
 * - Admin: Início, Agenda, Chat, Painel, Perfil
 * - Barbeiro: Início, Agenda, Chat, Painel, Perfil
 * - Cliente: Início, Agenda, Chat, Perfil
 */
export default function TabLayout() {
  const [userRole, setUserRole] = useState<'admin' | 'barber' | 'client'>('client');

  useEffect(() => {
    async function checkRole() {
      console.log('[TABS] Verificando role do usuário...');
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', user.id)
          .single();
        
        if (data) {
          const role = data.role || 'client';
          setUserRole(role);
          console.log(`[TABS] Usuário: ${data.full_name} | Role: ${role}`);
          
          if (role === 'admin') {
            console.log('[TABS] ✅ ADMIN - Mostrando aba Painel');
          } else if (role === 'barber') {
            console.log('[TABS] ✅ BARBEIRO - Mostrando aba Painel');
          } else {
            console.log('[TABS] CLIENTE - Ocultando aba Painel');
          }
        }
      }
    }
    checkRole();
  }, []);

  // Verificar se deve mostrar a aba admin
  const showAdminTab = userRole === 'admin' || userRole === 'barber';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#1e1e1e',
          borderTopColor: '#333333',
        },
        tabBarActiveTintColor: '#d4af37',
        tabBarInactiveTintColor: '#888888',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'calendar' : 'calendar-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: 'Painel',
          // Mostrar aba apenas para admin ou barbeiro
          href: showAdminTab ? '/(tabs)/admin' : null,
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'briefcase' : 'briefcase-outline'} size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
