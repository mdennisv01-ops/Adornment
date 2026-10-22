const { AiTryOnJob, Product } = require('../../models');
const ApiError = require('../../utils/ApiError');
const aiProvider = require('./aiProvider');
const logger = require('../../config/logger');

/**
 * Creates a job in QUEUED state, then kicks off generation. Generation runs
 * "fire and forget" from the caller's perspective — the client polls
 * GET /ai-studio/jobs/:id for status, matching a real async image-gen API.
 * (Swap this for a proper queue — BullMQ, SQS, etc. — at real scale.)
 */
async function createJob({ productId, sourcePhotoUrl, pose, lighting, environment, staffId, customerId }) {
  let garmentImageUrl = null;
  if (productId) {
    const product = await Product.findById(productId);
    if (!product) throw ApiError.notFound('Product not found');
    garmentImageUrl = product.images.find((i) => i.isPrimary)?.url || product.images[0]?.url || null;
  }

  const job = await AiTryOnJob.create({
    product: productId,
    staff: staffId,
    customer: customerId,
    sourcePhotoUrl,
    pose,
    lighting,
    environment,
    status: 'QUEUED',
  });

  processJob(job._id, { sourcePhotoUrl, garmentImageUrl, pose, lighting, environment }).catch((err) =>
    logger.error({ err, jobId: job._id }, 'AI try-on job failed unexpectedly')
  );

  return job;
}

async function processJob(jobId, params) {
  await AiTryOnJob.findByIdAndUpdate(jobId, { status: 'PROCESSING' });
  try {
    const { resultUrl } = await aiProvider.generateTryOn(params);
    await AiTryOnJob.findByIdAndUpdate(jobId, {
      status: 'SUCCEEDED',
      resultUrl,
      completedAt: new Date(),
    });
  } catch (err) {
    await AiTryOnJob.findByIdAndUpdate(jobId, {
      status: 'FAILED',
      errorMessage: err.message,
      completedAt: new Date(),
    });
  }
}

async function getJob(id, { staffId, customerId } = {}) {
  const where = { _id: id };
  if (staffId) where.staff = staffId;
  if (customerId) where.customer = customerId;
  const job = await AiTryOnJob.findOne(where).populate('product', 'name sku');
  if (!job) throw ApiError.notFound('AI try-on job not found');
  return job;
}

async function listJobs({ staffId, customerId, page = 1, pageSize = 20 } = {}) {
  const where = {};
  if (staffId) where.staff = staffId;
  if (customerId) where.customer = customerId;

  const [items, total] = await Promise.all([
    AiTryOnJob.find(where)
      .populate('product', 'name sku')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize),
    AiTryOnJob.countDocuments(where),
  ]);
  return { items, total, page, pageSize };
}

module.exports = { createJob, getJob, listJobs };
