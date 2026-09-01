import { Router } from 'express';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} from '../controllers/project.controller.js';
import {
  createProjectValidator,
  updateProjectValidator,
  projectIdParamValidator,
} from '../validators/project.validator.js';
import { validate } from '../../../middlewares/validate.middleware.js';
import { protect } from '../../../middlewares/auth.middleware.js';
import { authorize } from '../../../middlewares/rbac.middleware.js';
import { PRIVILEGED_ROLES } from '../../../utils/constants.js';

const router = Router();

router.use(protect);

// Projects are master data: only Admins / Super Admins manage them.
// Employees can still read them (needed to pick a project when creating a lead).
router.post('/', authorize(...PRIVILEGED_ROLES), createProjectValidator, validate, createProject);
router.get('/', getProjects);
router.get('/:id', projectIdParamValidator, validate, getProjectById);
router.put('/:id', authorize(...PRIVILEGED_ROLES), updateProjectValidator, validate, updateProject);
router.delete('/:id', authorize(...PRIVILEGED_ROLES), projectIdParamValidator, validate, deleteProject);

export default router;
