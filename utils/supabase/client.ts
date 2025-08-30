import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const schema = process.env.NEXT_PUBLIC_SUPABASE_SCHEMA || 'knowledge';

export type KnowledgeAdvisorDatabase = {
  [key: string]: {
    Tables: {
      knowledge_base: {
        Row: { id: string; title: string };
        Insert: { title: string };
        Update: { title?: string };
      };
    };
  };
};

let supabaseClient: ReturnType<
  typeof createSupabaseClient<KnowledgeAdvisorDatabase>
> | null = null;
let supabaseTableClient: ReturnType<
  ReturnType<typeof createSupabaseClient<KnowledgeAdvisorDatabase>>['schema']
> | null = null;
let supabaseTableAuth: ReturnType<
  ReturnType<typeof createSupabaseClient<KnowledgeAdvisorDatabase>>['schema']
> | null = null;

export function createClient() {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient<KnowledgeAdvisorDatabase>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: true,
          storageKey: 'supabase.auth.token',
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        }
      }
    );
  }
  return supabaseClient;
}

export function createClientTable() {
  if (!supabaseTableClient) {
    supabaseTableClient = createClient().schema(schema);
  }
  return supabaseTableClient;
}

export function createClientAuth() {
  if (!supabaseTableAuth) {
    supabaseTableAuth = createClient().schema('auth');
  }
  return supabaseTableAuth;
}
