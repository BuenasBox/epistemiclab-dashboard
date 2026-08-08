import { authenticatedLabUser, LAB_CORS, labJson, recordLabEpistemicEvent } from '../_shared/lab-runtime.ts';
import { getBottleTransferTask } from '../_shared/bottle-transfer-tasks.ts';

// La corrección se decide EXCLUSIVAMENTE server-side contra correct_option_id -- el cliente
// nunca la conoce de antemano. `decision_made` es un event_type ya usado y válido (ver
// submit-bottle-step); se reutiliza aquí con metadata.kind='transfer_challenge' en vez de
// inventar un event_type nuevo que el CHECK constraint de epistemic_events podría no aceptar.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: LAB_CORS });
  const auth = await authenticatedLabUser(req, 'bottle_lab');
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  try {
    const body = await req.json().catch(() => null);
    const taskId = typeof body?.task_id === 'string' ? body.task_id.trim() : '';
    const optionId = typeof body?.option_id === 'string' ? body.option_id.trim() : '';
    if (!taskId || !optionId) return labJson({ ok: false, error: 'Invalid transfer submission' }, 400);
    const task = getBottleTransferTask(taskId);
    if (!task) return labJson({ ok: false, error: 'Unknown transfer task' }, 404);
    const correct = task.correct_option_id === optionId;
    const now = new Date().toISOString();
    await recordLabEpistemicEvent(supabase, {
      userId: user.id,
      sessionId: `transfer:${taskId}`,
      occurredAt: now,
      sourceMode: 'bottle_lab_pro',
      eventId: `bottle:transfer:${user.id}:${taskId}:${now}`,
      eventType: 'decision_made',
      payload: { transfer_task_id: taskId, correct },
      evidence: {},
      metadata: { kind: 'transfer_challenge', misconception: task.misconception },
    });
    return labJson({
      ok: true,
      correct,
      rule: task.rule,
      feedback: correct
        ? 'Reconociste la misma regla en un contexto distinto -- eso es justo lo que se transfiere.'
        : 'Todavía no. Vuelve a leer la regla transferible y fíjate qué señal del nuevo contexto juega el mismo papel que en el caso anterior.',
    });
  } catch {
    return labJson({ ok: false, error: 'Unable to submit Bottle transfer challenge' }, 500);
  }
});
