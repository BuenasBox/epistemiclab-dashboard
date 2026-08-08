import { authenticatedLabUser, LAB_CORS, labJson } from '../_shared/lab-runtime.ts';
import { pickBottleTransferTask, publicTransferTask } from '../_shared/bottle-transfer-tasks.ts';

// Transfer Challenge (Learning Experience 2.0 - Loop 5). Sin dependencia de sesión ni de
// lab_items.transfer_task_id (que todavía no existe en el runtime importado): el cliente pasa
// el código de misconception que YA recibió legítimamente durante la sesión (mentor_feedback /
// evaluation.mentor.misconception_code) para elegir una tarea de la misma familia. La respuesta
// pasa por publicTransferTask(), que retira el campo de respuesta correcta antes de enviarla.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: LAB_CORS });
  const auth = await authenticatedLabUser(req, 'bottle_lab');
  if (auth.response) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const hint = typeof body?.misconception_hint === 'string' ? body.misconception_hint.trim() : null;
    const task = pickBottleTransferTask(hint);
    return labJson({ ok: true, task: publicTransferTask(task) });
  } catch {
    return labJson({ ok: false, error: 'Unable to start Bottle transfer challenge' }, 500);
  }
});
