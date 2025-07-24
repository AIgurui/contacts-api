const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get token from query parameter
    const { token } = req.query;
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }

    // For now, let's just validate that it's not empty and looks like a token
    // We'll add proper JWT validation in the next step
    if (token === 'fake123' || token.length < 10) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Temporary: Extract user ID from a simple token format
    // In production, this will be proper JWT decoding
    let userId;
    if (token === 'test-token-a7df163a') {
      userId = 'a7df163a-3ac2-4b99-8d1b-b5fe02a516db';
    } else {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    console.log(`Fetching contacts for user: ${userId}`);

    // Query Supabase for contacts belonging to this user only
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Return the contacts (empty array if none found)
    return res.status(200).json(contacts || []);
    
  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};
