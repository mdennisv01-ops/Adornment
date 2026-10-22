const { z } = require('zod');
const { objectIdSchema } = require('../../utils/objectId');

const createJobSchema = z.object({
  productId: objectIdSchema.optional(),
  pose: z.string().max(40).optional(),
  lighting: z.string().max(40).optional(),
  environment: z.string().max(40).optional(),
});

const idParamSchema = z.object({ id: objectIdSchema });

const listJobsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

module.exports = { createJobSchema, idParamSchema, listJobsQuerySchema };
