/**
 * Unit tests for Login component
 * Tests user interactions, form validation, and API calls
 */

import React, { useState } from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mock component (demonstration)
// In real project, import from src/app/pages/Login
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Email and password required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Invalid email format');
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        data-testid="email-input"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-testid="password-input"
      />
      {error && <p data-testid="error-message">{error}</p>}
      <button type="submit">Login</button>
    </form>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Form Rendering', () => {
    it('should render email and password input fields', () => {
      const { getByTestId } = render(<Login onLogin={vi.fn()} />);

      expect(getByTestId('email-input')).toBeInTheDocument();
      expect(getByTestId('password-input')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<Login onLogin={vi.fn()} />);

      const button = screen.getByRole('button', { name: /login/i });
      expect(button).toBeInTheDocument();
    });

    it('should set input type to email for email field', () => {
      const { getByTestId } = render(<Login onLogin={vi.fn()} />);

      const emailInput = getByTestId('email-input');
      expect(emailInput.type).toBe('email');
    });

    it('should set input type to password for password field', () => {
      const { getByTestId } = render(<Login onLogin={vi.fn()} />);

      const passwordInput = getByTestId('password-input');
      expect(passwordInput.type).toBe('password');
    });
  });

  describe('Form Validation', () => {
    it('should show error when email is empty', async () => {
      const { getByTestId, queryByTestId } = render(<Login onLogin={vi.fn()} />);

      const passwordInput = getByTestId('password-input');
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(queryByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      const { getByTestId, queryByTestId } = render(<Login onLogin={vi.fn()} />);

      const emailInput = getByTestId('email-input');
      const submitButton = screen.getByRole('button', { name: /login/i });

      fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(queryByTestId('error-message')).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      const { getByTestId, container } = render(<Login onLogin={vi.fn()} />);

      const emailInput = getByTestId('email-input') as HTMLInputElement;
      const passwordInput = getByTestId('password-input') as HTMLInputElement;
      const form = container.querySelector('form') as HTMLFormElement;

      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.submit(form);

      // Wait for error message to appear
      await waitFor(() => {
        const errorElement = screen.getByTestId('error-message');
        expect(errorElement).toBeInTheDocument();
        expect(errorElement.textContent).toContain('Invalid');
      });
    });

    it('should not show error for valid inputs', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'test-token' })
        })
      );

      const { getByTestId, queryByTestId } = render(<Login onLogin={vi.fn()} />);

      fireEvent.change(getByTestId('email-input'), {
        target: { value: 'user@example.com' }
      });
      fireEvent.change(getByTestId('password-input'), {
        target: { value: 'password123' }
      });
      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(queryByTestId('error-message')).not.toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should update email input on user typing', () => {
      const { getByTestId } = render(<Login onLogin={vi.fn()} />);

      const emailInput = getByTestId('email-input') as HTMLInputElement;
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

      expect(emailInput.value).toBe('test@example.com');
    });

    it('should update password input on user typing', () => {
      const { getByTestId } = render(<Login onLogin={vi.fn()} />);

      const passwordInput = getByTestId('password-input') as HTMLInputElement;
      fireEvent.change(passwordInput, { target: { value: 'mypassword' } });

      expect(passwordInput.value).toBe('mypassword');
    });

    it('should prevent form submission with invalid data', async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const { getByTestId } = render(<Login onLogin={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /login/i }));

      await waitFor(() => {
        expect(mockFetch).not.toHaveBeenCalled();
      });
    });
  });
});

