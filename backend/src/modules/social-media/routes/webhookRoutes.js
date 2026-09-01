import { Router } from 'express';
import { verifyWebhook, receiveWebhookEvent } from '../webhooks/facebookWebhookController.js';

const router = Router();

// Meta calls this once when you register the callback URL in the App Dashboard
router.get('/facebook', verifyWebhook);
// Meta calls this every time a subscribed `leadgen` event happens (an
// Instant Form submission on the connected Page)
router.post('/facebook', receiveWebhookEvent);

export default router;
