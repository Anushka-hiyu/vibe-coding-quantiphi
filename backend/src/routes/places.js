import { Router } from 'express';
const router = Router();
const cache = new Map();
let lastRequestAt = 0;

router.get('/geocode', async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (q.length < 3 || q.length > 180) return res.status(400).json({ success: false, message: 'Enter a place name or address.' });
  const key = q.toLowerCase();
  if (cache.has(key)) return res.json({ success: true, data: cache.get(key) });

  try {
    // Nominatim is a community service: keep requests user-initiated, cached and paced.
    const wait = Math.max(0, 1100 - (Date.now() - lastRequestAt));
    if (wait) await new Promise(resolve => setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'WaypointTravelPlanner/1.0 (local demo application)', 'Accept-Language': 'en' },
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return res.status(502).json({ success: false, message: 'The map search service is temporarily unavailable.' });
    const results = await response.json();
    const item = results[0];
    if (!item) return res.status(404).json({ success: false, message: 'We could not find that place. You can still save it without map coordinates.' });
    const data = { latitude: Number(item.lat), longitude: Number(item.lon), displayName: item.display_name };
    cache.set(key, data);
    if (cache.size > 250) cache.delete(cache.keys().next().value);
    res.json({ success: true, data });
  } catch {
    res.status(502).json({ success: false, message: 'Map search could not be reached. You can still save the destination manually.' });
  }
});
export default router;
