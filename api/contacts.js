module.exports = async function handler(req, res) {
  try {
    return res.status(200).json({ 
      message: "Basic function is working!",
      method: req.method,
      query: req.query,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ 
      error: "Function failed", 
      details: error.message 
    });
  }
};
