// Simple in-memory rate limiter
// For production, use Redis or a proper rate limiting library

const rateLimitMap = new Map();

export function rateLimit(options = {}) {
  const {
    interval = 60 * 1000, // 1 minute
    maxRequests = 10, // 10 requests per interval
  } = options;

  return (req, res, next) => {
    const identifier = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitMap.has(identifier)) {
      rateLimitMap.set(identifier, []);
    }

    const requests = rateLimitMap.get(identifier);
    
    // Remove old requests outside the time window
    const recentRequests = requests.filter(timestamp => now - timestamp < interval);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: `Maximum ${maxRequests} requests per ${interval / 1000} seconds`,
        retryAfter: Math.ceil((recentRequests[0] + interval - now) / 1000)
      });
    }

    // Add current request
    recentRequests.push(now);
    rateLimitMap.set(identifier, recentRequests);

    // Clean up old entries periodically
    if (Math.random() < 0.01) {
      for (const [key, timestamps] of rateLimitMap.entries()) {
        const filtered = timestamps.filter(t => now - t < interval);
        if (filtered.length === 0) {
          rateLimitMap.delete(key);
        } else {
          rateLimitMap.set(key, filtered);
        }
      }
    }

    next();
  };
}

// Helper for Next.js API routes (since they don't use middleware the same way)
export function checkRateLimit(req, res, options) {
  const limiter = rateLimit(options);
  
  return new Promise((resolve, reject) => {
    limiter(req, res, (result) => {
      if (result instanceof Error) {
        reject(result);
      } else {
        resolve(result);
      }
    });
  });
}