import { Project } from '../models/project.model.js';
import { Lead } from '../models/lead.model.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiError } from '../../../utils/ApiError.js';
import { sendSuccess } from '../../../utils/ApiResponse.js';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../../../utils/constants.js';

// POST /projects
export const createProject = asyncHandler(async (req, res) => {
  const { name, type, location, description } = req.body;

  const project = await Project.create({
    name,
    type,
    location,
    description,
    createdBy: req.user._id,
  });

  return sendSuccess(res, 201, 'Project created successfully.', project);
});

// GET /projects
export const getProjects = asyncHandler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
  const { search, type, isActive } = req.query;

  const filter = {};
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (type) filter.type = type;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const [items, total] = await Promise.all([
    Project.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Project.countDocuments(filter),
  ]);

  return sendSuccess(res, 200, 'Projects fetched successfully.', items, {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
});

// GET /projects/:id
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id });
  if (!project) throw ApiError.notFound('Project not found.', 'PROJECT_NOT_FOUND');
  return sendSuccess(res, 200, 'Project fetched successfully.', project);
});

// PUT /projects/:id
export const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id });
  if (!project) throw ApiError.notFound('Project not found.', 'PROJECT_NOT_FOUND');

  const allowedFields = ['name', 'type', 'location', 'description', 'isActive'];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) project[field] = req.body[field];
  });

  await project.save();
  return sendSuccess(res, 200, 'Project updated successfully.', project);
});

// DELETE /projects/:id
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id });
  if (!project) throw ApiError.notFound('Project not found.', 'PROJECT_NOT_FOUND');

  const leadCount = await Lead.countDocuments({ project: project._id });
  if (leadCount > 0) {
    throw ApiError.conflict(
      `Cannot delete project. ${leadCount} lead(s) are linked to it. Reassign or delete those leads first.`,
      'PROJECT_HAS_LEADS'
    );
  }

  await project.deleteOne();
  return sendSuccess(res, 200, 'Project deleted successfully.');
});
