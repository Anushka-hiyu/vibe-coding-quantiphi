import { Router } from 'express';

const router = Router();

async function askLLM(messages, responseFormat) {
  const key = process.env.LLM_API_KEY;
  if (!key) return { content: null, reason: 'No LLM_API_KEY configured' };

  const base = (process.env.LLM_BASE_URL || 'https://api.groq.com/openai/v1').replace(/\/$/, '');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);
  try {
    const payload = {
      model: process.env.LLM_MODEL || 'openai/gpt-oss-20b',
      messages,
      temperature: 0.6
    };
    if (responseFormat) payload.response_format = { type: 'json_object' };
    const response = await fetch(`${base}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    if (!response.ok) {
      const detail = await response.text();
      return { content: null, reason: `Provider returned ${response.status}: ${detail.slice(0, 240)}` };
    }
    const data = await response.json();
    return { content: data.choices?.[0]?.message?.content || null, reason: null };
  } catch (error) {
    return { content: null, reason: error.name === 'AbortError' ? 'AI request timed out' : error.message };
  } finally {
    clearTimeout(timeout);
  }
}

router.post('/chat', async (req, res) => {
  const { message, context = {} } = req.body;
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, message: 'Please enter a message.' });
  }
  const system = 'You are Waypoint, a practical travel-planning assistant. Give concise, useful, safe, budget-aware suggestions. State when prices or opening hours are estimates and encourage checking current local details.';
  const result = await askLLM([
    { role: 'system', content: system },
    { role: 'user', content: `Trip context: ${JSON.stringify(context)}\nUser: ${message}` }
  ]);
  const reply = result.content || `Here is a practical starting point for "${message}".\n\n• Group nearby attractions together to reduce travel time.\n• Keep 15–20% of your budget unallocated for surprises.\n• Check opening hours and local transport before you go.\n• Add estimated costs to each activity, then update actual costs as you spend.\n\nTell me your destination, dates and budget and I can help shape a more specific plan.`;
  res.json({ success: true, data: { reply, mode: result.content ? 'llm' : 'demo-fallback', label: result.content ? 'Groq AI assistant' : 'Demo travel assistant', fallbackReason: result.reason } });
});

router.post('/generate-itinerary', async (req, res) => {
  const { destination = 'your destination', days = 3, budget = 10000, interests = [], travelStyle = 'balanced', travelers = 2 } = req.body;
  const dayCount = Math.min(7, Math.max(1, Number(days) || 3));
  const numericBudget = Math.max(0, Number(budget) || 0);
  const interestList = Array.isArray(interests) ? interests : String(interests).split(',').map(x => x.trim()).filter(Boolean);
  const prompt = `Create a practical ${dayCount}-day itinerary for ${destination}, for ${travelers} traveller(s), total budget ₹${numericBudget}, travel style ${travelStyle}, interests: ${interestList.join(', ') || 'sightseeing and food'}. Return only JSON with this shape: {"days":[{"day":1,"activities":[{"title":"...","description":"...","category":"Sightseeing","estimatedCost":1000,"startTime":"09:00"}]}]}. Include 3 activities per day, sensible timings, and keep estimated costs within the overall budget.`;
  const result = await askLLM([
    { role: 'system', content: 'You are a travel itinerary planner. Return valid JSON only. Do not invent guaranteed opening hours or exact prices.' },
    { role: 'user', content: prompt }
  ], true);

  let itinerary = null;
  let isLive = false;
  if (result.content) {
    try {
      const cleaned = result.content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed.days)) { itinerary = parsed; isLive = true; }
    } catch { /* Use the transparent fallback below. */ }
  }

  if (!itinerary) {
    const perDay = Math.floor(numericBudget / dayCount);
    const templates = [
      ['Arrival & local orientation', 'Explore a central neighbourhood', 'Local dinner'],
      ['Signature attraction', 'Culture or nature stop', 'Sunset viewpoint'],
      ['Slow morning', 'Market or museum visit', 'Departure']
    ];
    itinerary = {
      days: Array.from({ length: dayCount }, (_, i) => ({
        day: i + 1,
        activities: templates[i % templates.length].map((title, j) => ({
          title,
          description: `Suggested ${title.toLowerCase()} in ${destination}. Tailor the stop to ${interestList.join(', ') || 'your interests'} and confirm local timings before visiting.`,
          category: j === 2 ? 'Food' : 'Sightseeing',
          estimatedCost: Math.round(perDay * [0.35, 0.4, 0.25][j]),
          startTime: ['09:00', '13:00', '18:00'][j]
        }))
      }))
    };
  }
  res.json({ success: true, data: { ...itinerary, mode: isLive ? 'llm' : 'demo-fallback', label: isLive ? 'Groq AI generated' : 'Demo itinerary suggestions', fallbackReason: result.reason } });
});

export default router;
