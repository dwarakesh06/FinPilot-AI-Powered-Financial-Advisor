const { z } = require('zod');

const validateRequest = (schema) => async (req, res, next) => {
  try {
    const validated = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (validated.body) req.body = validated.body;
    if (validated.query) req.query = validated.query;
    if (validated.params) req.params = validated.params;

    return next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation Error Details:', JSON.stringify(error.errors, null, 2));
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    return next(error);
  }
};

module.exports = { validateRequest };
