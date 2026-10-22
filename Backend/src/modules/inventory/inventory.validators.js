const { z } = require('zod');
const { objectIdSchema } = require('../../utils/objectId');

const stockChangeSchema = z.object({
  variantId: objectIdSchema,
  quantity: z.coerce.number().int().positive(),
  reason: z.string().max(200).optional(),
});

const listMovementsQuerySchema = z.object({
  productId: objectIdSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

module.exports = { stockChangeSchema, listMovementsQuerySchema };
