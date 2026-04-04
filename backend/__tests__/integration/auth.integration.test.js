/**
 * Integration tests for authentication API
 *
 * Uses supertest to hit the real Express routes with a mocked database pool,
 * so we exercise controller validation, bcrypt hashing, JWT signing, and
 * response shapes without needing a live Postgres instance.
 */

import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// ---------- mock pg (must be before any module that imports db.js) ----------
const mockQuery = jest.fn();
const mockConnect = jest.fn().mockResolvedValue({ release: jest.fn() });

jest.unstable_mockModule('../../src/config/db.js', () => ({
  pool: { query: mockQuery, connect: mockConnect },
  connectDB: jest.fn().mockResolvedValue(undefined),
}));

// ---------- deterministic JWT values ----------
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn(() => 'mocked-jwt-token'),
    verify: jest.fn(() => ({ id: 'user-1' })),
  },
}));

// ---------- deterministic bcrypt ----------
jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
  },
}));

// Dynamic imports so the mocks take effect
const { default: bcrypt } = await import('bcryptjs');
const { default: supertest } = await import('supertest');
const { default: app } = await import('../../src/app.js');

const request = supertest(app);

describe('Auth API – Register (POST /api/auth/register)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 when password is shorter than 8 characters', async () => {
    const res = await request.post('/api/auth/register').send({
      name: 'Test',
      username: 'testuser',
      email: 'test@example.com',
      password: 'short',
      date_of_birth: '2000-01-01',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'password' }),
      ]),
    );
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request.post('/api/auth/register').send({
      password: 'validpass123',
    });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'general' }),
      ]),
    );
  });

  it('should return 409 when username already exists', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ username: 'taken', email: 'other@example.com' }],
    });

    const res = await request.post('/api/auth/register').send({
      name: 'Test',
      username: 'taken',
      email: 'new@example.com',
      password: 'validpass123',
      date_of_birth: '2000-01-01',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/Username/i);
  });

  it('should return 409 when email already exists', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ username: 'other', email: 'taken@example.com' }],
    });

    const res = await request.post('/api/auth/register').send({
      name: 'Test',
      username: 'newuser',
      email: 'taken@example.com',
      password: 'validpass123',
      date_of_birth: '2000-01-01',
    });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toMatch(/Email/i);
  });

  it('should return 201 with tokens on successful registration', async () => {
    mockQuery
      .mockResolvedValueOnce({ rows: [] }) // no conflict
      .mockResolvedValueOnce({             // INSERT returning user
        rows: [{
          id: 'user-1',
          name: 'Test',
          username: 'testuser',
          dob: new Date('2000-01-01'),
          created_at: new Date(),
        }],
      })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE refresh_token

    const res = await request.post('/api/auth/register').send({
      name: 'Test',
      username: 'testuser',
      email: 'test@example.com',
      password: 'validpass123',
      date_of_birth: '2000-01-01',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(res.body.token_type).toBe('Bearer');
    expect(res.body.user.username).toBe('testuser');
  });
});

describe('Auth API – Login (POST /api/auth/login)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    bcrypt.compare.mockResolvedValue(true);
  });

  it('should return 401 when username does not exist', async () => {
    mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request.post('/api/auth/login').send({
      username: 'ghost',
      password: 'password123',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/Invalid username or password/i);
  });

  it('should return 401 when password is wrong', async () => {
    mockQuery.mockResolvedValueOnce({
      rows: [{ id: 'user-1', username: 'real', password: 'hashed', dob: new Date('2000-01-01') }],
    });
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request.post('/api/auth/login').send({
      username: 'real',
      password: 'wrongpass',
    });

    expect(res.status).toBe(401);
    expect(res.body.error.message).toMatch(/Invalid username or password/i);
  });

  it('should return 200 with tokens on successful login', async () => {
    mockQuery
      .mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          name: 'Real User',
          username: 'real',
          password: 'hashed',
          dob: new Date('2000-01-01'),
          created_at: new Date(),
        }],
      })
      .mockResolvedValueOnce({ rows: [] }); // UPDATE refresh_token

    const res = await request.post('/api/auth/login').send({
      username: 'real',
      password: 'password123',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('access_token');
    expect(res.body).toHaveProperty('refresh_token');
    expect(res.body.token_type).toBe('Bearer');
    expect(res.body.user.username).toBe('real');
  });
});
