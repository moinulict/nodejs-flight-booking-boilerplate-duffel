// Request logging middleware
const requestLogger = (req, res, next) => {
  // Only log API requests to avoid clutter from static files
  if (req.url.startsWith('/api/')) {
    console.log('🌐 ===== INCOMING API REQUEST =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📍 Method:', req.method);
    console.log('🔗 URL:', req.url);
    console.log('📋 Headers:', JSON.stringify(req.headers, null, 2));
    if (req.method === 'POST' || req.method === 'PUT') {
      console.log('📦 Body:', JSON.stringify(req.body, null, 2));
    }
    console.log('🏁 ===== REQUEST DETAILS END =====');
  }
  next();
};

module.exports = { requestLogger };
