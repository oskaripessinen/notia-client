import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ShareModal from '../ShareModal';

// Mock userService
jest.mock('../../services/userService', () => ({
  getUsersByIds: jest.fn().mockResolvedValue([
    { _id: 'user1', email: 'user1@example.com' },
    { _id: 'user2', email: 'user2@example.com' }
  ])
}));

// Mock FontAwesome
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>icon</span>
}));

describe('ShareModal Component', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    notebook: { _id: 'notebook1', title: 'Test Notebook', users: ['user1', 'user2'] },
    onShare: jest.fn().mockResolvedValue({ success: true })
  };

  test('renders share modal with notebook title', async () => {
    render(<ShareModal {...mockProps} />);
    
    expect(screen.getByText(/share "Test Notebook" with others/i)).toBeInTheDocument();
    
    // Should load user emails
    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
      expect(screen.getByText('user2@example.com')).toBeInTheDocument();
    });
  });

  test('allows adding new emails', async () => {
    render(<ShareModal {...mockProps} />);
    
    const emailInput = screen.getByPlaceholderText(/enter email and press enter to share/i);
    fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    fireEvent.keyDown(emailInput, { key: 'Enter' });
    
    expect(mockProps.onShare).toHaveBeenCalledWith(['newuser@example.com']);
    
    // Wait for the UI to update after the share operation
    await waitFor(() => {
      // The input should be cleared
      expect(emailInput.value).toBe('');
    });
  });

  test('shows validation error for invalid email', () => {
    render(<ShareModal {...mockProps} />);
    
    const emailInput = screen.getByPlaceholderText(/enter email and press enter to share/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.keyDown(emailInput, { key: 'Enter' });
    
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(mockProps.onShare).not.toHaveBeenCalled();
  });

  test('calls onClose when close button is clicked', () => {
    render(<ShareModal {...mockProps} />);
    
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});