import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
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

    // Verify and decode the JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Extract user ID from the validated token
    const userId = decoded.user_id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Token missing user ID' });
    }

    console.log(`Fetching contacts for authenticated user: ${userId}`);

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
    return res.status(500).json({ error: 'Internal server error' });
  }
}
