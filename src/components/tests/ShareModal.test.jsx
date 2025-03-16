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

// Mock noteService
jest.mock('../../services/noteService', () => ({
  __esModule: true,
  default: {
    shareNotebook: jest.fn().mockResolvedValue({ success: true })
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
      { _id: 'user1', email: 'user1@example.com' },
      { _id: 'user2', email: 'user2@example.com' }
    ]);
  });

  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    notebook: { _id: 'notebook1', title: 'Test Notebook', users: ['user1', 'user2'] },
    onShare: jest.fn().mockResolvedValue({ success: true })
  };

  test('renders share modal with notebook title', async () => {
    // Renderöi komponentti act():n sisällä
    await act(async () => {
      render(<ShareModal {...mockProps} />);
    });
    
    // Tarkista perus UI-elementit
    expect(screen.getByText('Share "Test Notebook" with others')).toBeInTheDocument();
    
    // Odota että käyttäjäsähköpostit latautuvat - käytä findByText waitFor:in sijaan
    const userEmail = await screen.findByText('user1@example.com', {}, { timeout: 3000 });
    expect(userEmail).toBeInTheDocument();
  });

  test('allows adding new emails', async () => {
    await act(async () => {
      render(<ShareModal {...mockProps} />);
    });
    
    // Käytä await findByPlaceholderText hakemaan elementti kun se on saatavilla
    const emailInput = await screen.findByPlaceholderText(/enter email and press enter to share/i);
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'newuser@example.com' } });
    });
    
    await act(async () => {
      fireEvent.keyDown(emailInput, { key: 'Enter' });
    });
    
    // Varmista että onShare kutsuttiin oikeilla parametreilla
    expect(mockProps.onShare).toHaveBeenCalledWith(['newuser@example.com']);
    
    // Odota että input tyhjenee onnistuneen operaation jälkeen
    await waitFor(() => {
      expect(emailInput.value).toBe('');
    });
  });

  test('shows validation error for invalid email', async () => {
    await act(async () => {
      render(<ShareModal {...mockProps} />);
    });
    
    const emailInput = await screen.findByPlaceholderText(/enter email and press enter to share/i);
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
      fireEvent.keyDown(emailInput, { key: 'Enter' });
    });
    
    // Tarkista että virheviesti näytetään
    expect(screen.getByText(/please enter a valid email address/i)).toBeInTheDocument();
    expect(mockProps.onShare).not.toHaveBeenCalled();
  });

  test('calls onClose when close button is clicked', async () => {
    await act(async () => {
      render(<ShareModal {...mockProps} />);
    });
    
    const closeButton = await screen.findByRole('button', { name: /close/i });
    
    await act(async () => {
      fireEvent.click(closeButton);
    });
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});