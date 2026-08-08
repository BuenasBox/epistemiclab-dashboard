import { authenticatedLabUser, LAB_CORS, labJson } from '../_shared/lab-runtime.ts';
import { pickBottleTransferTask, publicTransferTask } from '../_shared/bottle-transfer-tasks.ts';

// Transfer Challenge (Learning Experience 2.0 - Loop 5). El cliente pasa el código de
// misconception que YA recibió legítimamente durante la sesión (mentor_feedback /
// evaluation.mentor.misconception_code) para elegir una tarea de la misma familia -- eso sigue
// siendo la señal de mayor prioridad, la más específica al error real cometido.
//
// Priority 9 (Transfer Challenge variety review, Product Implementation Marathon): cuando NO
// hubo misconception (el caso más común), esto caía siempre en el mismo DEFAULT_TASK_ID
// hardcodeado -- verificado en vivo, cualquier sesión limpia mostraba idéntico reto sin
// relación con el ítem practicado. Ahora, si el cliente manda session_id (dato ya visible,
// nunca sensible), el servidor resuelve item_id -> evaluation_spec.transfer_task server-side
// (item_id en sí NUNCA se envía al cliente, se mantiene privado) para usarlo como segunda
// prioridad, por delante del default genérico.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: LAB_CORS });
  const auth = await authenticatedLabUser(req, 'bottle_lab');
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
        const { data: item } = await supabase.from('lab_items').select('evaluation_spec').eq('item_id', session.item_id).eq('lab_type', 'bottle').maybeSingle();
        const spec = item?.evaluation_spec as { transfer_task?: string } | undefined;
        itemTransferTaskId = typeof spec?.transfer_task === 'string' ? spec.transfer_task : null;
      }
    }
    const task = pickBottleTransferTask(hint, itemTransferTaskId);
    return labJson({ ok: true, task: publicTransferTask(task) });
  } catch {
    return labJson({ ok: false, error: 'Unable to start Bottle transfer challenge' }, 500);
  }
});
