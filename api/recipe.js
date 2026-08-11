export default async function handler(req, res) {
  console.log('API called with method:', req.method);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const API_KEY = process.env.GOOGLE_API_KEY;
  const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  console.log('API_KEY exists:', !!API_KEY);
  console.log('MODEL:', MODEL);

  if (!API_KEY) {
    return res.status(500).json({
      error: 'API key not configured on server. Add GOOGLE_API_KEY to environment variables.'
    });
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
    console.log('Calling Gemini API at:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        tools: [{ google_search: {} }]
      })
    });

    const data = await response.json();
    console.log('Full Gemini response:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.log('Gemini error:', data);
      return res.status(response.status).json({
        error: data?.error?.message || `Gemini API failed with status ${response.status}`
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
