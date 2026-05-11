export default async function handler(req, res) {
  const { path: eiaPath, ...params } = req.query;
  if (!eiaPath) return res.status(400).json({ error: 'missing path param' });

  const url = new URL(`https://api.eia.gov/v2/${eiaPath}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const upstream = await fetch(url.toString());
    const data = await upstream.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
}
