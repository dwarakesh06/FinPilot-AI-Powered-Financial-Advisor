const mongoose = require('mongoose');

// Mock mongoose connect for tests that don't need a real DB
jest.mock('mongoose', () => {
  const original = jest.requireActual('mongoose');
  return {
    ...original,
    connect: jest.fn().mockResolvedValue({ connection: { host: 'test-host' } }),
  };
});
