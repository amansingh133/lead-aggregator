import { Router } from 'express';
import authRoutes from '../modules/real-estate/routes/auth.routes.js';
import projectRoutes from '../modules/real-estate/routes/project.routes.js';
import leadRoutes from '../modules/real-estate/routes/lead.routes.js';
import followupRoutes from '../modules/real-estate/routes/followup.routes.js';
import dashboardRoutes from '../modules/real-estate/routes/dashboard.routes.js';
import attendanceRoutes from '../modules/real-estate/routes/attendance.routes.js';
import adminRoutes from '../modules/real-estate/routes/admin.routes.js';
import socialMediaRoutes from '../modules/social-media/routes/index.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'API is healthy' }));

router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/leads', leadRoutes);
router.use('/followups', followupRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/admin', adminRoutes);
// The social-media-aggregator module, merged in as a feature module -
// see modules/social-media/. Its own routes/index.js applies `protect`
// once for everything mounted here.
router.use('/social', socialMediaRoutes);

export default router;
