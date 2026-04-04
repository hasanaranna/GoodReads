import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { Login } from '../app/pages/Login';

const mockNavigate = vi.fn();
const mockSetUserName = vi.fn();

vi.mock('react-router', async () => {
  const actual = await vi.importActual<typeof import('react-router')>('react-router');
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../app/context/BooksContext', () => ({
  useBooks: () => ({
    books: [],
    loading: false,
    error: null,
    updateBook: vi.fn(),
    addBook: vi.fn(),
    removeBook: vi.fn(),
    getBook: vi.fn(),
    shelfCounts: { all: 0, read: 0, currentlyReading: 0, wantToRead: 0 },
    userName: '',
    setUserName: mockSetUserName,
    refreshBooks: vi.fn(),
    updateReview: vi.fn(),
  }),
}));

vi.mock('jwt-decode', () => ({
  jwtDecode: () => ({ id: '1', name: 'Test User', username: 'testuser' }),
}));

function renderLogin() {
  return render(
    <MemoryRouter>
      <Login />
    </MemoryRouter>,
  );
}

describe('Login page – Sign In mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render username and password fields', () => {
    renderLogin();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('should render the Sign In button', () => {
    renderLogin();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show error on failed login response', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Invalid username or password.' } }),
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'baduser' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Invalid username or password/i)).toBeInTheDocument();
    });
  });

  it('should navigate to /mybooks on successful login', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: 'fake.jwt.token',
          user: { name: 'Test User', username: 'testuser' },
        }),
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mybooks', { replace: true });
    });
  });

  it('should store access_token in localStorage on login', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: 'stored-token',
          user: { name: 'User' },
        }),
    });

    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('stored-token');
    });
  });

  it('should show network error when fetch throws', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network failure'));

    renderLogin();

    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'user' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });
});

describe('Login page – Sign Up mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  function switchToSignUp() {
    renderLogin();
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
  }

  it('should show registration fields after clicking Sign up', () => {
    switchToSignUp();
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
  });

  it('should show error when passwords do not match', async () => {
    switchToSignUp();

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'a@b.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'mismatch' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });
  });

  it('should navigate to /mybooks on successful registration', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: 'new.jwt.token',
          user: { name: 'New User', username: 'newuser' },
        }),
    });

    switchToSignUp();

    fireEvent.change(screen.getByLabelText(/your name/i), { target: { value: 'New User' } });
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'new@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/date of birth/i), { target: { value: '2000-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/mybooks', { replace: true });
    });
  });
});
