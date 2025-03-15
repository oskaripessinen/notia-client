import { render, screen, fireEvent } from '@testing-library/react';
import FrontPage from '../FrontPage';

// Mock AuthModal component
jest.mock('../../components/AuthModal', () => {
  return function DummyAuthModal({ isOpen, type }) {
    return isOpen ? <div data-testid={`auth-modal-${type}`}>Auth Modal</div> : null;
  };
});

// Mock FontAwesome
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>icon</span>
}));

describe('FrontPage Component', () => {
  test('renders front page header and content', () => {
    render(<FrontPage />);
    
    expect(screen.getByText('Notia')).toBeInTheDocument();
    expect(screen.getByText('Ideas & plans in one place.')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Notia.')).toBeInTheDocument();
    expect(screen.getByText('Seamlessly connect your ideas with Notia.')).toBeInTheDocument();
  });

  test('shows login modal when Log in button is clicked', () => {
    render(<FrontPage />);
    
    const loginButton = screen.getByRole('button', { name: /log in/i });
    fireEvent.click(loginButton);
    
    expect(screen.getByTestId('auth-modal-login')).toBeInTheDocument();
  });

  test('shows signup modal when Get Notia free button is clicked', () => {
    render(<FrontPage />);
    
    const signupButtons = screen.getAllByRole('button', { name: /get notia free/i });
    fireEvent.click(signupButtons[0]); // Click the first one
    
    expect(screen.getByTestId('auth-modal-signup')).toBeInTheDocument();
  });
});