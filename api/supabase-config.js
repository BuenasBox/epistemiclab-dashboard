module.exports = function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    response.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  var url = process.env.SUPABASE_URL;
  var publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    response.status(503).json({ error: 'supabase_config_unavailable' });
    return;
  }

  response.setHeader(
    'Cache-Control',
    'public, max-age=300, s-maxage=300, stale-while-revalidate=3600'
  );
  response.status(200).json({
    url: url,
    publishableKey: publishableKey,
  });
};

