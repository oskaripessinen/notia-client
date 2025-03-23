import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import ShareModal from '../ShareModal';
import '@testing-library/jest-dom';
import userService from '../../services/userService';

// Mock userService
jest.mock('../../services/userService', () => ({
  __esModule: true,
  default: {
    getUsersByIds: jest.fn()
  }
}));

// Mock FontAwesome
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>icon</span>
}));

describe('ShareModal Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Aseta mockattu vastaus jokaiselle testille
    userService.getUsersByIds.mockResolvedValue([
      { _id: 'user1', email: 'user1@example.com' }
    ]);
  });

  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    notebook: { _id: 'notebook1', title: 'Test Notebook', users: ['user1'] },
    onShare: jest.fn(),
    currentUser: {
      _id: 'currentUser',
      email: 'current@example.com'
    }
  };

  test('renders share modal with notebook title and shared users', async () => {
    await act(async () => {
      render(<ShareModal {...mockProps} />);
    });

    expect(screen.getByText('Share Notebook')).toBeInTheDocument();
    
    const shareText = screen.getByText((content, element) => {
      return element.tagName.toLowerCase() === 'p' && 
             content.includes('Share') && 
             content.includes('Test Notebook') && 
             content.includes('with others');
    });
    expect(shareText).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('user1@example.com')).toBeInTheDocument();
    });
  });

  test('allows adding new emails', async () => {
    await act(async () => {
      render(<ShareModal {...mockProps} />);
    });
    

    const emailInput = await screen.findByPlaceholderText(/enter email/i);
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    });
    
    await act(async () => {
      fireEvent.keyDown(emailInput, { key: 'Enter' });
    });
    

    expect(mockProps.onShare).toHaveBeenCalledWith(['newuser@example.com']);
    

    await waitFor(() => {
      expect(emailInput.value).toBe('');
    });
  });

  test('shows validation error for invalid email', async () => {
    await act(async () => {
      render(<ShareModal {...mockProps} />);
    });
    
    const emailInput = await screen.findByPlaceholderText(/enter email/i);
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.keyDown(emailInput, { key: 'Enter' });
    });
    
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(mockProps.onShare).not.toHaveBeenCalled();
  });

  test('calls onClose when close button is clicked', async () => {
    await act(async () => {
      render(<ShareModal {...mockProps} />);
    });
    
    const closeButton = await screen.findByTestId('close-button');
    
    await act(async () => {
      fireEvent.click(closeButton);
    });
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});