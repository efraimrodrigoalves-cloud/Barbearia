import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '../lib/notifications';
import { logger } from '../lib/logger';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  // Log apenas uma vez na montagem
  const hasLoggedStart = useRef(false);
  if (!hasLoggedStart.current) {
    logger.sessionStart();
    hasLoggedStart.current = true;
  }

  const colorScheme = useColorScheme();
  const [session, setSession] = useState<Session | null>(null);
  const [initialized, setInitialized] = useState(false);
  const segments = useSegments();
  const router = useRouter();
  const isNavigating = useRef(false);

  // Inicializar sessão (roda apenas uma vez)
  useEffect(() => {
    logger.info('Verificando sessão...');

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setInitialized(true);

      if (session?.user) {
        logger.info(`Sessão ativa encontrada: ${session.user.id}`);
        registerForPushNotificationsAsync(session.user.id);
      } else {
        logger.info('Nenhuma sessão ativa - redirecionando para login');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info(`Auth state changed: ${event}`);
      setSession(session);
      if (session?.user) {
        registerForPushNotificationsAsync(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Redirecionamento baseado em sessão (evita loop)
  useEffect(() => {
    if (!initialized || isNavigating.current) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      isNavigating.current = true;
      logger.info('Sem sessão, redirecionando para login');
      router.replace('/(auth)/login');
      setTimeout(() => { isNavigating.current = false; }, 500);
    } else if (session && inAuthGroup) {
      isNavigating.current = true;
      logger.info('Com sessão, redirecionando para tabs');
      router.replace('/(tabs)');
      setTimeout(() => { isNavigating.current = false; }, 500);
    }
  }, [session, initialized]);

  if (!initialized) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
