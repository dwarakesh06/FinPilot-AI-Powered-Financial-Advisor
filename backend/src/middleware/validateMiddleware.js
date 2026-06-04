/**
 * Zod Request Body Validation Helper Middleware
 */
const validateBody = (schema) => (req, res, next) => {
  try {
    // Validate request body against schema
    schema.parse(req.body);
    next();
  } catch (error) {
    const errorDetails = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }));
    
    res.status(400);
    return next(new Error(`Validation failed: ${errorDetails.map(d => `${d.field} (${d.message})`).join(', ')}`));
  }
};

module.exports = {
  validateBody,
};
