// Get Supabase client instance
const supabaseClient = (() => {
  const { createClient } = window.SupabaseClient || {};
  if (!createClient) return null;
  return createClient(
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

    if (!session) {
      console.log('No active session');
      return null;
    }

    return session.access_token;
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
