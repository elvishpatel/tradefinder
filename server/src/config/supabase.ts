import { createClient } from '@supabase/supabase-js';
import config from './index';
import logger from '../utils/logger';

let supabaseClient: any;

const isSupabaseConfigured = 
  config.SUPABASE_URL && 
  config.SUPABASE_URL.startsWith('http') && 
  config.SUPABASE_KEY;

if (isSupabaseConfigured) {
  try {
    supabaseClient = createClient(config.SUPABASE_URL, config.SUPABASE_KEY);
    logger.info('Supabase client successfully initialized.');
  } catch (err: any) {
    logger.error(`Failed to initialize Supabase client: ${err.message}`);
    setupMockClient();
  }
} else {
  logger.warn('[WARNING]: Supabase URL or Key is not configured. Falling back to Mock Database Client.');
  setupMockClient();
}

function setupMockClient() {
  // A mock client proxy to prevent server crashes on database queries
  const mockDbQuery = () => ({
    select: () => mockDbQuery(),
    eq: () => mockDbQuery(),
    order: () => mockDbQuery(),
    limit: () => mockDbQuery(),
    insert: () => mockDbQuery(),
    upsert: () => mockDbQuery(),
    delete: () => mockDbQuery(),
    maybeSingle: async () => ({ data: null, error: null }),
    single: async () => ({ data: null, error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  });

  supabaseClient = {
    from: () => mockDbQuery(),
    auth: {
      signUp: async () => ({ data: null, error: new Error('Database disconnected') }),
      signInWithPassword: async () => ({ data: null, error: new Error('Database disconnected') }),
    }
  };
}

export const supabase = supabaseClient;
export default supabase;
