const { Types } = require('mongoose');
const { z } = require('zod');

/** Zod schema for a valid Mongo ObjectId string, used in route params. */
const objectIdSchema = z.string().refine((v) => Types.ObjectId.isValid(v), {
  message: 'Must be a valid id',
});

module.exports = { objectIdSchema };
