import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for share endpoints
 * Limits to 100 requests per minute per IP address
 * Prevents scraping and DoS attacks on public share URLs
 */
export const shareLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 100, // Maximum 100 requests per window per IP
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for localhost in development
  skip: (req) => {
    if (process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1') {
      return false; // Don't skip - still apply rate limiting
    }
    return false;
  },
});
