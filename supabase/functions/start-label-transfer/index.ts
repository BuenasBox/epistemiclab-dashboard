import { authenticatedLabUser, LAB_CORS, labJson } from '../_shared/lab-runtime.ts';
import { pickLabelTransferTask, publicTransferTask } from '../_shared/label-transfer-tasks.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: LAB_CORS });
  const auth = await authenticatedLabUser(req, 'label_lab');
  if (auth.response) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    const hint = typeof body?.misconception_hint === 'string' ? body.misconception_hint.trim() : null;
    const task = pickLabelTransferTask(hint);
    return labJson({ ok: true, task: publicTransferTask(task) });
  } catch {
    return labJson({ ok: false, error: 'Unable to start Label transfer challenge' }, 500);
  }
});
