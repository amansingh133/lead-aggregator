import { Router } from 'express';
import {
  getDashboardSummary,
  getFollowUpsBucket,
  getVisitsBucket,
} from '../controllers/dashboard.controller.js';
import { protect } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.get('/summary', getDashboardSummary);
router.get('/followups', getFollowUpsBucket); // ?type=today|tomorrow|pending
router.get('/visits', getVisitsBucket); // ?type=today|tomorrow

export default router;
