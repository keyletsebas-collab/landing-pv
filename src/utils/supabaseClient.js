import { createClient } from '@supabase/supabase-js';

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SERVICE = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

// Cliente normal (lectura de profiles)
export const supabase = createClient(URL, ANON);

// Cliente admin (cambio de contraseñas en Auth)
// Solo se crea si la service key está configurada
export const supabaseAdmin = SERVICE && SERVICE !== 'TU_SERVICE_ROLE_KEY_AQUI'
  ? createClient(URL, SERVICE, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : null;
