import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Editor from '../Editor';

// Define a helper function to create unsubscribe functions
const noop = () => {};

// Mock socketService
jest.mock('../../services/socketService', () => {
  const mockNoop = () => {};
  
  return {
    joinNotebook: jest.fn(),
    leaveNotebook: jest.fn(),
    onEvent: jest.fn().mockImplementation(() => mockNoop),
    updateNote: jest.fn(),
    handleNotebookSync: jest.fn().mockReturnValue(mockNoop)
  };
});

// Mock noteService
jest.mock('../../services/noteService', () => ({
  updateNote: jest.fn().mockResolvedValue({ _id: 'note1', title: 'Updated Note' }),
  shareNotebook: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../services/userService', () => ({
  getUsersByIds: jest.fn().mockResolvedValue([
    { _id: 'user1', email: 'user1@example.com', displayName: 'User 1' }
  ])
}));

// Mock FontAwesome
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => {
    const iconName = icon?.iconName || 'default-icon';
    return <span data-testid={`icon-${iconName}`}>icon</span>;
  }
}));

// Mock ShareModal
jest.mock('../ShareModal', () => {
  return function DummyShareModal({ isOpen }) {
    return isOpen ? <div data-testid="share-modal">Share Modal</div> : null;
  };
});

// Käytetään jest.spyOn:ia mockata useEffect
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    useEffect: jest.fn(originalReact.useEffect),
  };
});

describe('Editor Component', () => {
  const mockProps = {
    activeNote: { _id: 'note1', id: 'note1', title: 'Test Note', content: ['Content line 1'] },
    notes: { title: 'Test Note', content: ['Content line 1'] },
    handleChange: jest.fn(),
    handleKeyDown: jest.fn(),
    handleTitleChange: jest.fn(),
    activeNotebook: { _id: 'notebook1', title: 'Test Notebook', users: ['user1'] },
    handleDeleteNote: jest.fn(),
    setNotes: jest.fn(),
    updateNoteInLocalState: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
    jest.useRealTimers();
  });

  test('renders editor with note title and content', async () => {
    await act(async () => {
      render(<Editor {...mockProps} />);
      jest.runAllTimers();
    });
    
    const titleInput = screen.getByDisplayValue('Test Note');
    expect(titleInput).toBeInTheDocument();
    
    const contentInput = screen.getByDisplayValue('Content line 1');
    expect(contentInput).toBeInTheDocument();
  });

  test('updates title when input changes', async () => {
    await act(async () => {
      render(<Editor {...mockProps} />);
      jest.runAllTimers();
      await Promise.resolve();
    });
    
    const titleInput = screen.getByDisplayValue('Test Note');
    await act(async () => {
      fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
      jest.runAllTimers();
      await Promise.resolve();
    });
    
    expect(mockProps.handleTitleChange).toHaveBeenCalledWith('Updated Title');
  });

  test('shows share modal when share action is selected', async () => {
    await act(async () => {
      render(<Editor {...mockProps} />);
      jest.runAllTimers();
      await Promise.resolve();
    });
    
    // Oletetaan, että share-painikkeen luokka on .editor-share-button
    const dropdownToggle = document.querySelector('.editor-share-button');
    expect(dropdownToggle).not.toBeNull();
    
    await act(async () => {
      fireEvent.click(dropdownToggle);
      jest.runAllTimers();
      await Promise.resolve();
    });
    
    // Oletetaan, että Share-tekstiä käytetään valinnan tunnistamiseen
    const shareOption = screen.getByText('Share');
    await act(async () => {
      fireEvent.click(shareOption);
      jest.runAllTimers();
      await Promise.resolve();
    });
    
    expect(screen.getByTestId('share-modal')).toBeInTheDocument();
  });

  test('displays empty state when no note is selected', async () => {
    await act(async () => {
      render(<Editor {...mockProps} activeNote={null} activeNotebook={null} />);
      jest.runAllTimers();
      await Promise.resolve();
    });
    
    expect(screen.getByText('Select a notebook to start writing')).toBeInTheDocument();
  });
});