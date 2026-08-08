import { authenticatedLabUser, LAB_CORS, labJson } from '../_shared/lab-runtime.ts';
import { pickLabelTransferTask, publicTransferTask } from '../_shared/label-transfer-tasks.ts';

// Priority 9 (Transfer Challenge variety review, Product Implementation Marathon): mirrors the
// Bottle fix. When session_id is provided, resolve item_id -> evaluation_spec.transfer_task_id
// server-side (item_id itself stays private) so a clean session (no misconception) gets the
// item's own topically-relevant transfer task instead of always the same hardcoded default.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: LAB_CORS });
  const auth = await authenticatedLabUser(req, 'label_lab');
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  try {
    const body = await req.json().catch(() => null);
    const hint = typeof body?.misconception_hint === 'string' ? body.misconception_hint.trim() : null;
    const sessionId = typeof body?.session_id === 'string' ? body.session_id.trim() : '';
    let itemTransferTaskId: string | null = null;
    if (sessionId) {
      const { data: session } = await supabase.from('lab_sessions').select('item_id').eq('id', sessionId).eq('user_id', user.id).maybeSingle();
      if (session?.item_id) {
        const { data: item } = await supabase.from('lab_items').select('evaluation_spec').eq('item_id', session.item_id).eq('lab_type', 'label').maybeSingle();
        const spec = item?.evaluation_spec as { transfer_task_id?: string } | undefined;
        itemTransferTaskId = typeof spec?.transfer_task_id === 'string' ? spec.transfer_task_id : null;
      }
    }
    const task = pickLabelTransferTask(hint, itemTransferTaskId);
    return labJson({ ok: true, task: publicTransferTask(task) });
  } catch {
    return labJson({ ok: false, error: 'Unable to start Label transfer challenge' }, 500);
  }
});
