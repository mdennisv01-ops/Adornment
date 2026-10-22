const asyncHandler = require('../../utils/asyncHandler');
const ApiError = require('../../utils/ApiError');
const aiStudioService = require('./aiStudio.service');

const createJob = asyncHandler(async (req, res) => {
  if (!req.file) throw ApiError.badRequest('A source photo upload is required');
  const sourcePhotoUrl = `/uploads/try-on-sources/${req.file.filename}`;

  const isStaff = req.user.type === 'STAFF';
  const job = await aiStudioService.createJob({
    ...req.body,
    sourcePhotoUrl,
    staffId: isStaff ? req.user.sub : undefined,
    customerId: !isStaff ? req.user.sub : undefined,
  });

  res.status(202).json({ success: true, data: job });
});

const getJob = asyncHandler(async (req, res) => {
  const isStaff = req.user.type === 'STAFF';
  const job = await aiStudioService.getJob(req.params.id, {
    staffId: isStaff ? req.user.sub : undefined,
    customerId: isStaff ? undefined : req.user.sub,
  });
  res.json({ success: true, data: job });
});

const listJobs = asyncHandler(async (req, res) => {
  const isStaff = req.user.type === 'STAFF';
  const result = await aiStudioService.listJobs({
    ...req.query,
    staffId: isStaff ? req.user.sub : undefined,
    customerId: !isStaff ? req.user.sub : undefined,
  });
  res.json({ success: true, data: result });
});

module.exports = { createJob, getJob, listJobs };
