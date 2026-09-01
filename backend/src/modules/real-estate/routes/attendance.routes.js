import { Router } from 'express';
import { toggleAttendance, getTodayStatus, getMyMonthlyAttendance } from '../controllers/attendance.controller.js';
import { attendanceToggleValidator, monthlyReportQueryValidator } from '../validators/attendance.validator.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { protect } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.post('/toggle', attendanceToggleValidator, validate, toggleAttendance);
router.get('/status', getTodayStatus);
router.get('/report/monthly', monthlyReportQueryValidator, validate, getMyMonthlyAttendance);

export default router;
