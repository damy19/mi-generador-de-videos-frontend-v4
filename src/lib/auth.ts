import { supabase } from "./supabaseClient";

export const getAuthToken = async (): Promise<string | null> => {
  // Esto toma el access token real de la sesión activa de Supabase.
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token ?? null;
    return token;
  } catch {
    return null;
  }
};

// Helpers opcionales (compat)
export const saveAuthToken = (_token: string) => {};

export const clearAuthToken = () => {};

