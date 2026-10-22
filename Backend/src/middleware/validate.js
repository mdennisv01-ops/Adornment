const ApiError = require('../utils/ApiError');

/**
 * validate({ body, query, params }) runs each provided Zod schema against
 * the matching part of the request and replaces it with the parsed
 * (type-coerced, stripped-of-unknown-keys) result. Throws a 400 with the
 * full list of issues on failure, instead of letting bad input reach the DB.
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      for (const key of ['body', 'query', 'params']) {
        const schema = schemas[key];
        if (!schema) continue;
        const result = schema.safeParse(req[key]);
        if (!result.success) {
          throw ApiError.badRequest(
            'Validation failed',
            result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
          );
        }
        req[key] = result.data;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = validate;
