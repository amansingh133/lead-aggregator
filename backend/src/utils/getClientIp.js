/**
 * Requires `app.set('trust proxy', true)` in app.js so `req.ip` correctly
 * reflects X-Forwarded-For when the app runs behind a load balancer/reverse
 * proxy (Nginx, Render, Heroku, etc). Falls back to the raw socket address.
 */
export const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.ip || req.socket?.remoteAddress || 'Unknown';
};
