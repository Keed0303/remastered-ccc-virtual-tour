// Accounts and live presence. Supabase in production, with a local stand-in for development.
import type { Backend } from '../../types/backend';
import { demoBackend } from './demo';
import { supabaseBackend } from './supabase';

const URL_ = import.meta.env.VITE_SUPABASE_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// In development, adding ?demo to the address uses the local stand-in even when keys exist.
const forceDemo = import.meta.env.DEV && new URLSearchParams(location.search).has('demo');
export const backendMode = forceDemo ? 'demo' : URL_ && KEY ? 'supabase' : import.meta.env.DEV ? 'demo' : 'none';

let shared: Promise<Backend | null> | null = null;

// One backend per page, so remounting React components never creates a second client.
export function createBackend(): Promise<Backend | null> {
  if (!shared) {
    if (backendMode === 'supabase') shared = supabaseBackend(URL_!, KEY!);
    else shared = Promise.resolve(backendMode === 'demo' ? demoBackend() : null);
  }
  return shared;
}
