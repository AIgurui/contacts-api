// Import 'jose' instead of 'jsonwebtoken'
import * as jose from 'jose';
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

    // Create a secret key object. 'jose' requires the secret to be encoded.
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    // Verify the JWT using 'jose'.
    const { payload: decodedJWT } = await jose.jwtVerify(token, secret);

    // DOUBLE SECURITY: Ensure JWT user matches header user
    // decodedJWT.sub contains the user ID from the token
    if (decodedJWT.sub !== userIdFromHeader) {
      return res.status(401).json({ error: 'User ID mismatch – security violation detected' });
    }

    // Proceed with Supabase query using the validated user ID
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', decodedJWT.sub); // Use the ID from the token

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json(contacts);

  } catch (error) {
    console.error('API Error:', error);
    // The error from jose.jwtVerify will be caught here if the token is invalid
    return res.status(401).json({ error: 'Invalid token' });
  }
}