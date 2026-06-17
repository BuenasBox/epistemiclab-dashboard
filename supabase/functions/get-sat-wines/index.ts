import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ============================================================================
// SAT-2 — get-sat-wines
// Entrega SOLO un payload render-safe del inventario SAT. NUNCA `canonical`.
// La identidad del vino y las observaciones esperadas son la "respuesta" del
// ejercicio y permanecen server-side. Lectura vía service_role (bypassa RLS);
// la tabla sigue deny-all para anon/authenticated.
// Gobernanza: safe_for_examiner=false. No abre RLS. No crea policy pública.
// ============================================================================

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_MODES = ['blind_simulation', 'bottle_guided', 'label_simulation'];
const ALLOWED_SOURCES = ['canonical_wine', 'user_bottle', 'simulated_label'];
const ALLOWED_WINE_TYPES = ['BLANCO', 'ROSADO', 'TINTO'];

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1) JWT obligatorio
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2) Parámetros (todos opcionales, con defaults y validación de enum)
    const url = new URL(req.url);

    const mode = (url.searchParams.get('mode') || 'blind_simulation').trim();
    if (!ALLOWED_MODES.includes(mode)) {
      return new Response(JSON.stringify({ error: `Invalid mode: ${mode}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const source = (url.searchParams.get('source') || 'canonical_wine').trim();
    if (!ALLOWED_SOURCES.includes(source)) {
      return new Response(JSON.stringify({ error: `Invalid source: ${source}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const wineType = url.searchParams.get('wine_type');
    if (wineType && !ALLOWED_WINE_TYPES.includes(wineType)) {
      return new Response(JSON.stringify({ error: `Invalid wine_type: ${wineType}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '12'), 1), 70);

    // 3) Lectura server-side. Seleccionamos SOLO columnas render-safe.
    //    `canonical` NUNCA entra en el select => no puede filtrarse por accidente.
    let query = supabase
      .from('sat_wines')
      .select('id,wine_type,priority,display_label,source')
      .eq('source', source)
      .order('priority', { ascending: true })
      .order('id', { ascending: true });

    if (wineType) {
      query = query.eq('wine_type', wineType);
    }

    const { data: rows, error } = await query.limit(limit);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4) Proyección render-safe explícita (whitelist). Sin identidad, sin rúbrica.
    const wines = (rows || []).map((w: any) => ({
      id: w.id,
      wine_type: w.wine_type,
      priority: w.priority,
      display_label: w.display_label,
      mode,
      source: w.source,
      // session_hint: genérico, derivado SOLO del wine_type (no revela identidad).
      session_hint: w.wine_type === 'BLANCO'
        ? 'Cata a ciegas — vino blanco'
        : w.wine_type === 'TINTO'
          ? 'Cata a ciegas — vino tinto'
          : 'Cata a ciegas — vino rosado',
    }));

    return new Response(
      JSON.stringify({
        wines,
        count: wines.length,
        mode,
        source,
        watermark: {
          user_id: user.id,
          issued_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // TTL 1h
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
