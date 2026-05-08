export default async function handler(req, res) {
  const { path: fredPath, ...params } = req.query;
  if (!fredPath) return res.status(400).json({ error: 'missing path param' });

  const url = new URL(`https://api.stlouisfed.org/fred/${fredPath}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const upstream = await fetch(url.toString());
    const data = await upstream.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, s-maxage=1800, stale-while-revalidate=3600');
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
