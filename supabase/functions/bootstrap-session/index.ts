import {
  ep04CorsHeaders,
  ep04JsonResponse,
  loadEP04ReadModel,
} from '../_shared/ep04-backend-read-http.ts';
import { projectBootstrapSession } from '../_shared/bootstrap-session.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: ep04CorsHeaders });
  }
  if (req.method !== 'GET') {
    return ep04JsonResponse({ ok: false, error: 'Method not allowed' }, 405);
  }

  try {
    const loaded = await loadEP04ReadModel(req);
    if (loaded.response) return loaded.response;

    const payload = projectBootstrapSession(loaded.readModel, loaded.user);
    return ep04JsonResponse({
      ok: true,
      data: payload,
    }, 200);
  } catch (err) {
    return ep04JsonResponse({ ok: false, error: String(err) }, 500);
  }
});
