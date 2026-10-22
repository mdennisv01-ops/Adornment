const { z } = require('zod');
const { objectIdSchema } = require('../../utils/objectId');

const addCartItemSchema = z.object({
  productId: objectIdSchema,
  variantId: objectIdSchema,
  quantity: z.coerce.number().int().positive().default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0),
});

const checkoutSchema = z.object({
  shippingAddress: z.object({
    line1: z.string().min(2),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().optional(),
    country: z.string().min(1),
  }),
});

const listOrdersQuerySchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FULFILLED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'FULFILLED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
});

const idParamSchema = z.object({ id: objectIdSchema });
const variantIdParamSchema = z.object({ variantId: objectIdSchema });

module.exports = {
  addCartItemSchema,
  updateCartItemSchema,
  checkoutSchema,
  listOrdersQuerySchema,
  updateStatusSchema,
  idParamSchema,
  variantIdParamSchema,
};
