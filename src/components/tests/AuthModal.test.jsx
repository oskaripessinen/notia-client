import { render, screen, fireEvent } from '@testing-library/react';
import AuthModal from '../AuthModal';

// Mock the GoogleLoginButton component
jest.mock('../googleLoginButton', () => {
  return function DummyGoogleLoginButton() {
    return <div data-testid="google-login-button">Google Login Button</div>;
  };
});

describe('AuthModal Component', () => {
  test('renders login form when type is login', () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={jest.fn()} 
        type="login" 
        onToggle={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Log in')).toBeInTheDocument();
    expect(screen.getByText('to continue to Notia')).toBeInTheDocument();
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
  });

  test('renders signup form when type is signup', () => {
    render(
      <AuthModal 
        isOpen={true} 
        onClose={jest.fn()} 
        type="signup" 
        onToggle={jest.fn()} 
      />
    );
    
    expect(screen.getByText('Sign up')).toBeInTheDocument();
    expect(screen.getByText('to start using Notia')).toBeInTheDocument();
    expect(screen.getByTestId('google-login-button')).toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const onCloseMock = jest.fn();
    render(
      <AuthModal 
        isOpen={true} 
        onClose={onCloseMock} 
        type="login" 
        onToggle={jest.fn()} 
      />
    );
    
    fireEvent.click(screen.getByTestId('close-button'));
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  test('calls onToggle when toggle link is clicked', () => {
    const onToggleMock = jest.fn();
    render(
      <AuthModal 
        isOpen={true} 
        onClose={jest.fn()} 
        type="login" 
        onToggle={onToggleMock} 
      />
    );
    
    fireEvent.click(screen.getByText('Sign up'));
    expect(onToggleMock).toHaveBeenCalledWith('signup');
  });

  test('does not render when isOpen is false', () => {
    render(
      <AuthModal 
        isOpen={false} 
        onClose={jest.fn()} 
        type="login" 
        onToggle={jest.fn()} 
      />
    );
    
    expect(screen.queryByText('Log in')).not.toBeInTheDocument();
  });
});