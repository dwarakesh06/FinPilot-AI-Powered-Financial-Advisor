const { validateRequest } = require('../src/middleware/validateRequest');
const { z } = require('zod');

describe('validateRequest Middleware', () => {
  const schema = z.object({
    body: z.object({
      name: z.string(),
      age: z.number(),
    }),
  });

  const middleware = validateRequest(schema);

  it('should call next() when validation passes', async () => {
    const req = {
      body: { name: 'Test User', age: 25 },
    };
    const res = {};
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('should return 400 when validation fails', async () => {
    const req = {
      body: { name: 'Test User', age: 'twenty-five' }, // Invalid age
    };
    
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: expect.any(Array),
      })
    );
  });
});
