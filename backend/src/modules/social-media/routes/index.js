import { Router } from 'express';
import { protect } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/rbac.middleware.js';
import { PRIVILEGED_ROLES } from '../../../utils/constants.js';
import metaConnectionRoutes from './metaConnectionRoutes.js';
import campaignRoutes from './campaignRoutes.js';

const router = Router();

// Every social-media route is Admin / Super Admin only. Employees never
// manage the Meta connection or trigger lead syncs directly; they only work
// leads once assigned one via the unified /api/v1/leads endpoint. Webhooks
// are NOT mounted here - Meta calls those directly and can't carry a JWT,
// so they stay mounted separately in app.js, outside /api/v1 and
// unauthenticated (verified instead via HMAC signature - see
// webhooks/facebookWebhookController.js).
router.use(protect, authorize(...PRIVILEGED_ROLES));

// Connect / inspect / disconnect the org's Meta assets.
router.use('/meta-connection', metaConnectionRoutes);
// List Lead Ads campaigns and pull their leads into the unified Lead system.
router.use('/campaigns', campaignRoutes);

export default router;
