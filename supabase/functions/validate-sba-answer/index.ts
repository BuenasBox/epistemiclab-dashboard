import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.108.2';

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
      'Cache-Control': 'private, no-store',
    },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Unauthorized' }, 401);

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const itemId = typeof body.item_id === 'string' ? body.item_id.trim() : '';
    const selectedLetter = typeof body.selected_letter === 'string'
      ? body.selected_letter.trim().toUpperCase()
      : '';
    const mode = ['mentor', 'trainer', 'reviewer'].includes(body.mode) ? body.mode : 'mentor';

    if (!itemId || itemId.length > 160 || !/^[A-D]$/.test(selectedLetter)) {
      return json({ error: 'Invalid answer payload' }, 400);
    }

    const { data: item, error: itemError } = await supabase
      .from('sba_bank')
      .select('id,correct_index,correct_letter,causal_chain,feedback_by_mode,micro_drill')
      .eq('id', itemId)
      .maybeSingle();
    if (itemError) return json({ error: itemError.message }, 500);
    if (!item) return json({ error: 'Question not found' }, 404);

    const storedLetter = typeof item.correct_letter === 'string'
      ? item.correct_letter.toUpperCase()
      : '';
    const correctIndex = Number.isInteger(item.correct_index)
      ? item.correct_index
      : ['A', 'B', 'C', 'D'].indexOf(storedLetter);
    if (correctIndex < 0 || correctIndex > 3) {
      return json({ error: 'Question answer key is invalid' }, 500);
    }
    const correctLetter = storedLetter || String.fromCharCode(65 + correctIndex);
    const feedbackProfile = item.feedback_by_mode || {};
    const feedback = feedbackProfile[mode]
      || feedbackProfile.mentor
      || feedbackProfile.trainer
      || feedbackProfile.reviewer
      || null;

    // Completion is idempotent and recorded only after a valid question and
    // answer payload have been processed by this server-side validator.
    const { data: progress, error: progressError } = await supabase.rpc('complete_sba_question', {
      p_user_id: user.id,
      p_question_id: item.id,
    });
    if (progressError) return json({ error: progressError.message }, 500);

    return json({
      correct: selectedLetter === correctLetter,
      correct_index: correctIndex,
      correct_letter: correctLetter,
      causal_chain: item.causal_chain || null,
      feedback,
      micro_drill: item.micro_drill || null,
      progress: progress?.[0] || null,
    });
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});
