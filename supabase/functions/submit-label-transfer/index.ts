import { authenticatedLabUser, LAB_CORS, labJson, recordLabEpistemicEvent } from '../_shared/lab-runtime.ts';
import { getLabelTransferTask } from '../_shared/label-transfer-tasks.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: LAB_CORS });
  const auth = await authenticatedLabUser(req, 'label_lab');
  if (auth.response) return auth.response;
  const { supabase, user } = auth;
  try {
    const body = await req.json().catch(() => null);
    const taskId = typeof body?.task_id === 'string' ? body.task_id.trim() : '';
    const optionId = typeof body?.option_id === 'string' ? body.option_id.trim() : '';
    if (!taskId || !optionId) return labJson({ ok: false, error: 'Invalid transfer submission' }, 400);
    const task = getLabelTransferTask(taskId);
    if (!task) return labJson({ ok: false, error: 'Unknown transfer task' }, 404);
    const correct = task.correct_option_id === optionId;
    const now = new Date().toISOString();
    await recordLabEpistemicEvent(supabase, {
      userId: user.id,
      sessionId: `transfer:${taskId}`,
      occurredAt: now,
      sourceMode: 'label_lab_pro',
      eventId: `label:transfer:${user.id}:${taskId}:${now}`,
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
        : 'Todavía no. Vuelve a leer la regla transferible y fíjate qué dato del nuevo contexto juega el mismo papel que en el caso anterior.',
    });
  } catch {
    return labJson({ ok: false, error: 'Unable to submit Label transfer challenge' }, 500);
  }
});
