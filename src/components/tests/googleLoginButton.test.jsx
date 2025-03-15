import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleLoginButton from '../googleLoginButton';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock the Google Identity API
const mockGsiToken = 'mock-google-token-123';

// Create a mock for the Google Identity API
beforeAll(() => {
  // Mock the Google Identity API
  global.google = {
    accounts: {
      id: {
        initialize: jest.fn(({ callback }) => {
          // Store the callback for later use in our tests
          global.googleCallback = callback;
        }),
        renderButton: jest.fn((container, options) => {
          // Create a fake Google button for testing
          const button = document.createElement('button');
          button.textContent = 'Sign in with Google';
          button.dataset.testid = 'google-signin-button';
          button.onclick = () => {
            if (global.googleCallback) {
              global.googleCallback({ credential: mockGsiToken });
            }
          };
          container.appendChild(button);
        }),
        prompt: jest.fn()
      }
    }
  };
});

// Clean up after all tests
afterAll(() => {
  delete global.google;
  delete global.googleCallback;
});

// Helper function to render GoogleLoginButton with router context
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui);
};

describe('GoogleLoginButton Component', () => {
  beforeEach(() => {
    // Clear mocks before each test
    jest.clearAllMocks();
    mockNavigate.mockReset();
  });

  test('renders the Google Sign-in button', () => {
    renderWithRouter(<GoogleLoginButton onSuccess={jest.fn()} />);
    
    // Verify the button is rendered
    const googleButton = screen.getByTestId('google-signin-button');
    expect(googleButton).toBeInTheDocument();
    expect(googleButton).toHaveTextContent('Sign in with Google');
  });
  
  test('calls onSuccess with credential when Google login succeeds', async () => {
    const onSuccessMock = jest.fn();
    renderWithRouter(<GoogleLoginButton onSuccess={onSuccessMock} />);
    
    // Simulate a click on the Google button
    const googleButton = screen.getByTestId('google-signin-button');
    fireEvent.click(googleButton);
    
    // Check if onSuccess was called with the correct token
    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalledWith({ credential: mockGsiToken });
    });
  });
  
  test('initializes the Google API with the correct parameters', () => {
    renderWithRouter(<GoogleLoginButton onSuccess={jest.fn()} />);
    
    // Check that initialize was called
    expect(global.google.accounts.id.initialize).toHaveBeenCalled();
    
    // Check the parameters passed to initialize
    const initializeCall = global.google.accounts.id.initialize.mock.calls[0][0];
    expect(initializeCall).toHaveProperty('callback');
  });
  
  test('does not crash when Google API is not available', () => {
    // Temporarily remove the Google API
    const tempGoogle = global.google;
    delete global.google;
    
    // Component should render without crashing
    expect(() => renderWithRouter(<GoogleLoginButton onSuccess={jest.fn()} />)).not.toThrow();
    
    // Restore the Google API
    global.google = tempGoogle;
  });
  
  test('redirects to /notes after successful login', async () => {
    // Mock the AuthService.verifyGoogleToken to return success
    jest.mock('../services/authService', () => ({
      verifyGoogleToken: jest.fn().mockResolvedValue({ success: true }),
      checkAuthStatus: jest.fn().mockResolvedValue({ authenticated: true })
    }));
    
    renderWithRouter(<GoogleLoginButton />);
    
    // Simulate a click on the Google button
    const googleButton = screen.getByTestId('google-signin-button');
    fireEvent.click(googleButton);
    
    // Check if navigate was called with /notes
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/notes');
    });
  });
  
  test('renders with custom text if provided', () => {
    const customText = "Login with Google";
    renderWithRouter(<GoogleLoginButton onSuccess={jest.fn()} text={customText} />);
    
    // Verify the component rendered without errors
    expect(screen.getByTestId('google-signin-button')).toBeInTheDocument();
  });
});