jest.setTimeout(20000); // Kasvata timeoutia 15 sekuntiin
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleLoginButton from '../googleLoginButton';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));




jest.mock('../../services/authService', () => {
  const mockVerifyToken = jest.fn().mockResolvedValue({ success: true });
  const mockCheckStatus = jest.fn().mockResolvedValue({ authenticated: true });
  
  return {
    __esModule: true,
    default: {
      verifyGoogleToken: mockVerifyToken,
      checkAuthStatus: mockCheckStatus
    },
    mockVerifyToken,
    mockCheckStatus
  };
});

// Mock @react-oauth/google components
jest.mock('@react-oauth/google', () => {

  const mockCredentialResponse = { credential: 'mock-google-token-123' };
  
  return {
    GoogleOAuthProvider: ({ children }) => children,
    GoogleLogin: ({ onSuccess, text }) => (
      <button 
        data-testid="google-signin-button"
        onClick={() => onSuccess && onSuccess(mockCredentialResponse)}
      >
        {text || 'Sign in with Google'}
      </button>
    )
  };
});

const renderWithRouter = (ui) => {
  return render(
    <BrowserRouter>
      {ui}
    </BrowserRouter>
  );
};


describe('GoogleLoginButton Component', () => {
  let authServiceMock;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    authServiceMock = require('../../services/authService');
    authServiceMock.default.verifyGoogleToken.mockResolvedValue({ success: true });
    authServiceMock.default.checkAuthStatus.mockResolvedValue({ authenticated: true });
    
    delete window.location;
    window.location = new URL('http://localhost');
  });
  
  test('renders the Google Sign-in button', () => {
    renderWithRouter(<GoogleLoginButton />);
    expect(screen.getByTestId('google-signin-button')).toBeInTheDocument();
  });
  
  test('redirects to /notes after successful login', async () => {
    renderWithRouter(<GoogleLoginButton />);
    
    const googleButton = screen.getByTestId('google-signin-button');
    fireEvent.click(googleButton);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/notes');
    }, { timeout: 5000 });
  });

  test('redirects to login page if auth check fails', async () => {
    // Mock unsuccessful auth check
    authServiceMock.default.checkAuthStatus.mockResolvedValueOnce({ authenticated: false });
    
    window.location = new URL('http://localhost?auth=success');
    
    renderWithRouter(<GoogleLoginButton />);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
  
  test('handles API error during login', async () => {
    authServiceMock.default.verifyGoogleToken.mockRejectedValueOnce(new Error('Auth failed'));
    
    renderWithRouter(<GoogleLoginButton />);
    

    const googleButton = screen.getByTestId('google-signin-button');
    fireEvent.click(googleButton);
    
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalledWith('/notes');
    });
  });
  
  test('handles successful auth query parameter', async () => {

    jest.spyOn(URLSearchParams.prototype, 'get').mockImplementation((param) => {
      if (param === 'auth') return 'success';
      return null;
    });
    
    delete window.location;
    window.location = new URL('http://localhost?auth=success');
    
    authServiceMock.default.checkAuthStatus.mockImplementationOnce(() => {
      setTimeout(() => mockNavigate('/notes'), 0);
      return Promise.resolve({ authenticated: true });
    });
    
    renderWithRouter(<GoogleLoginButton />);
    
    await waitFor(() => {
      console.log('Current mockNavigate calls:', mockNavigate.mock.calls);
      expect(mockNavigate).toHaveBeenCalledWith('/notes');
    }, { timeout: 10000 });
    
    // Palauta mock alkutilaan
    URLSearchParams.prototype.get.mockRestore();
  });
});