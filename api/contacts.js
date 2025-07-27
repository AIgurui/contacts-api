const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
  try {
    // 1. Extract JWT from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Missing or invalid Authorization header',
        expected: 'Bearer <jwt_token>'
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Validate JWT (you'll need to set JWT_SECRET in Vercel environment variables)
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      return res.status(401).json({
        error: 'Invalid JWT token',
        details: jwtError.message
      });
    }

    // 3. Extract user_id from validated token
    const userId = decoded.user_id || decoded.id || decoded.sub;
    if (!userId) {
      return res.status(400).json({
        error: 'JWT token missing user_id',
        decoded: decoded
      });
    }

    // 4. Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 5. Query contacts filtered by user_id
    const { data: contacts, error: dbError } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId);

    if (dbError) {
      return res.status(500).json({
        error: 'Database query failed',
        details: dbError.message
      });
    }

    // 6. Return user's contacts
    return res.status(200).json({
      success: true,
      user_id: userId,
      contacts: contacts,
      count: contacts.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Function failed',
      details: error.message
    });
  }
};
