import { body, param } from 'express-validator';
import { PROJECT_TYPE_VALUES } from '../../../utils/constants.js';

export const createProjectValidator = [
  body('name').trim().notEmpty().withMessage('Project name is required'),
  body('type')
    .isIn(PROJECT_TYPE_VALUES)
    .withMessage(`Type must be one of: ${PROJECT_TYPE_VALUES.join(', ')}`),
  body('location').optional().trim(),
  body('description').optional().trim(),
];

export const updateProjectValidator = [
  param('id').isMongoId().withMessage('Invalid project id'),
  body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
  body('type').optional().isIn(PROJECT_TYPE_VALUES).withMessage(`Type must be one of: ${PROJECT_TYPE_VALUES.join(', ')}`),
  body('location').optional().trim(),
  body('description').optional().trim(),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
];

export const projectIdParamValidator = [param('id').isMongoId().withMessage('Invalid project id')];
