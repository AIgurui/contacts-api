import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  try {
    // Extract both JWT and user ID
    const authHeader = req.headers.authorization;
    const userIdFromHeader = req.headers['x-user-id'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }
    
    if (!userIdFromHeader) {
      return res.status(401).json({ error: 'Missing X-User-ID header' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    
    // Verify JWT
    const decodedJWT = jwt.verify(token, process.env.JWT_SECRET);
    
    // DOUBLE SECURITY: Ensure JWT user matches header user
    if (decodedJWT.user_id !== userIdFromHeader) {
      return res.status(401).json({ 
        error: 'User ID mismatch - security violation detected' 
      });
    }
    
    // Proceed with Supabase query using the validated user ID
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', decodedJWT.user_id);
      
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    
    return res.status(200).json(contacts);
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
}
