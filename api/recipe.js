export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const API_KEY = process.env.GOOGLE_API_KEY;
  const MODEL = process.env.GEMINI_MODEL || 'gemini-3-5-flash';

  if (!API_KEY) {
    return res.status(500).json({
      error: 'API key not configured on server.'
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || `Gemini API failed`
      });
    }

    return res.status(200).json(data);
  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({
      error: `Network error: ${err.message}`
    });
  }
}
