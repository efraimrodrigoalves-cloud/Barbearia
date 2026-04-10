import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Constants } from 'expo-constants';

const supabaseUrl = Constants?.manifest?.extra?.supabaseUrl 
  || process.env.EXPO_PUBLIC_SUPABASE_URL 
  || 'https://fsyhunabticbctlxreff.supabase.co';

const supabaseAnonKey = Constants?.manifest?.extra?.supabaseAnonKey 
  || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY 
  || 'sb_publishable_9iRnVWwKIA5YYoau4Lc7xA_WAOlsPh6';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
