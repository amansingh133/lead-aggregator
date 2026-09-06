import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import hpp from 'hpp';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './config/env.js';
import routes from './routes/index.js';
import webhookRoutes from './modules/social-media/routes/webhookRoutes.js';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';

const app = express();

// Needed so req.ip reflects the real client IP (via X-Forwarded-For) when
// deployed behind a reverse proxy/load balancer — used by the attendance
// module to capture the candidate's IP address on check-in/check-out.
// A bounded hop count (not `true`) is required by express-rate-limit:
// trusting every hop lets a client spoof X-Forwarded-For to bypass IP-based
// rate limiting.
// `2` = Coolify's edge proxy (Traefik) -> the frontend nginx container -> here.
// If you run this without the nginx hop (backend exposed directly behind
// only Coolify's proxy), set this back to `1`. Add one per extra proxy
// (e.g. a CDN in front of Coolify).
app.set('trust proxy', 2);

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
// `verify` stashes the exact raw bytes Meta sent on req.rawBody, before
// Express parses them into req.body. The Facebook webhook signature check
// (modules/social-media/webhooks/facebookWebhookController.js) needs those
// exact original bytes - re-serializing the parsed JSON would not reliably
// reproduce Meta's signature.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Facebook webhook — mounted BEFORE mongoSanitize/hpp/generalLimiter on
// purpose. Meta's GET verification handshake carries its parameters as
// `hub.mode` / `hub.verify_token` / `hub.challenge`, whose dots would be
// stripped by express-mongo-sanitize; and Meta can burst POST deliveries
// faster than the general API rate limit allows. It still runs through
// helmet + cors + the raw-body JSON parser above. It lives OUTSIDE
// /api/v1: this is the exact, stable callback URL pasted into the Meta App
// Dashboard. Unauthenticated (Meta calls it directly) - verified via HMAC
// signature instead, see facebookWebhookController.js.
app.use('/webhooks', webhookRoutes);

app.use(mongoSanitize());
app.use(hpp());
app.use(generalLimiter);

if (env.nodeEnv !== 'test') {
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
}

app.get('/', (req, res) => {
  res.json({ success: true, message: 'Real Estate Lead Management API is running' });
});

app.use(env.apiPrefix, routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
