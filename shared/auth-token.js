// Get Supabase client instance
const supabaseClient = (() => {
  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase JS not loaded');
    return null;
  }
  return window.supabase.createClient(
    'https://hylknjjhmxsuuwbsslkr.supabase.co',
    'sb_publishable_lXduWVjIjAVAcNFCn4GZhw_Vylh8tZw'
  );
})();

// Get Supabase session JWT token from Auth session
async function getAuthToken() {
  if (!supabaseClient) {
    console.warn('Supabase client not initialized');
    return null;
  }

  try {
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) {
      console.error('Auth session error:', error);
      return null;
    }

    if (session) {
      return session.access_token;
    }

    // Sin sesión: EpistemicLab requiere cuenta real (el sign-in anónimo está
    // deshabilitado en el proyecto de Supabase y, aunque se reactivara, el
    // trigger handle_new_auth_user exige email y rechazaría al usuario
    // anónimo). No lo intentamos: devolvemos null y quien llamó a esta
    // función decide cómo degradar (vista de muestra, aviso de login, etc.).
    return null;
  } catch (e) {
    console.error('getAuthToken error:', e);
    return null;
  }
}

// Require valid token, throw if missing
async function requireAuth() {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('NO_AUTH_SESSION');
  }
  return token;
}
