/* eslint-disable @typescript-eslint/no-require-imports */
module.exports = {
  __esModule: true,
  default: {
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
  },
};
