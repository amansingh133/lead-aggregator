import { Router } from 'express';
import { updateFollowUp, deleteFollowUp } from '../controllers/followup.controller.js';
import { updateFollowUpValidator, followUpIdParamValidator } from '../validators/followup.validator.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { protect } from '../../../middlewares/auth.middleware.js';

const router = Router();

router.use(protect);

router.put('/:id', updateFollowUpValidator, validate, updateFollowUp);
router.delete('/:id', followUpIdParamValidator, validate, deleteFollowUp);

export default router;
