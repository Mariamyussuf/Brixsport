import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider } from '@/hooks/useAuth';
import { AuthScreen } from '@/screens/AuthScreen';

// Mock the useRouter hook
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    };
  },
}));

// Mock fetch API
global.fetch = jest.fn();

describe('AuthScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders signup and login tabs', () => {
    render(
      <AuthProvider>
        <AuthScreen />
      </AuthProvider>
    );

    expect(screen.getByText('Sign Up')).toBeInTheDocument();
    expect(screen.getByText('Log in')).toBeInTheDocument();
  });

  it('switches between signup and login tabs', () => {
    render(
      <AuthProvider>
        <AuthScreen />
      </AuthProvider>
    );

    // Initially should show signup form
    expect(screen.getByLabelText('Name')).toBeInTheDocument();

    // Click login tab
    fireEvent.click(screen.getByText('Log in'));
    
    // Should now show login form (no name field)
    expect(screen.queryByLabelText('Name')).not.toBeInTheDocument();
    expect(screen.getByLabelText('E - mail')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('validates signup form fields', async () => {
    render(
      <AuthProvider>
        <AuthScreen />
      </AuthProvider>
    );

    // Submit empty form
    fireEvent.click(screen.getByText('Sign Up'));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Name is required.')).toBeInTheDocument();
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
    });
  });

  it('validates login form fields', async () => {
    render(
      <AuthProvider>
        <AuthScreen initialTab="login" />
      </AuthProvider>
    );

    // Submit empty form
    fireEvent.click(screen.getByText('Log in'));

    // Should show validation errors
    await waitFor(() => {
      expect(screen.getByText('Email is required.')).toBeInTheDocument();
      expect(screen.getByText('Password is required.')).toBeInTheDocument();
    });
  });

  it('handles signup API success', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user'
          }
        }
      })
    });

    render(
      <AuthProvider>
        <AuthScreen />
      </AuthProvider>
    );

    // Fill in form
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Enter your email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Enter password'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByLabelText('Confirm password'), { target: { value: 'Password123!' } });

    // Submit form
    fireEvent.click(screen.getByText('Sign Up'));

    // Should call API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!'
        })
      }));
    });
  });

  it('handles login API success', async () => {
    // Mock successful API response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: {
          token: 'mock-token',
          refreshToken: 'mock-refresh-token',
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'user'
          }
        }
      })
    });

    render(
      <AuthProvider>
        <AuthScreen initialTab="login" />
      </AuthProvider>
    );

    // Fill in form
    fireEvent.change(screen.getByLabelText('E - mail'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password123!' } });

    // Submit form
    fireEvent.click(screen.getByText('Log in'));

    // Should call API
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'Password123!'
        })
      }));
    });
  });
});