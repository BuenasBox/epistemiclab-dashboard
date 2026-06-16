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

    if (session) {
      return session.access_token;
    }

    // No session: try anonymous sign-in
    console.log('No session, attempting anonymous sign-in...');
    const { data: { user }, error: anonError } = await supabaseClient.auth.signInAnonymously();
    if (anonError) {
      console.error('Anonymous sign-in failed:', anonError);
      return null;
    }

    if (user) {
      const { data: { session: newSession } } = await supabaseClient.auth.getSession();
      if (newSession) {
        console.log('Anonymous session created');
        return newSession.access_token;
      }
    }

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
