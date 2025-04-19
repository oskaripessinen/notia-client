import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Editor from '../Editor';

const noop = () => {};


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

jest.mock('../../services/noteService', () => ({
  updateNote: jest.fn().mockResolvedValue({ _id: 'note1', title: 'Updated Note' }),
  shareNotebook: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('../../services/userService', () => ({
  getUsersByIds: jest.fn().mockResolvedValue([
    { _id: 'user1', email: 'user1@example.com', displayName: 'User 1' }
  ])
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon }) => {
    const iconName = icon?.iconName || 'default-icon';
    return <span data-testid={`icon-${iconName}`}>icon</span>;
  }
}));

jest.mock('../ShareModal', () => {
  return function DummyShareModal({ isOpen }) {
    return isOpen ? <div data-testid="share-modal">Share Modal</div> : null;
  };
});

jest.mock('../NoteBox', () => {
  return function DummyNoteBox({ note, index, placeholder }) {
    return (
      <div 
        className="note-boxx" 
        data-index={index} 
        data-placeholder={placeholder}
        contentEditable={true}
      >
        {note}
      </div>
    );
  };
});

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
    setIsShareModalOpen: jest.fn(),
    setIsAddingNotebook: jest.fn(),
    user: { 
      displayName: 'Test User',
      email: 'test@example.com'
    }
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
      await Promise.resolve();
    });
    
    const titleInput = screen.getByDisplayValue('Test Note');
    expect(titleInput).toBeInTheDocument();
    
    const contentElement = screen.getByText('Content line 1'); 
    expect(contentElement).toBeInTheDocument();
    expect(contentElement).toHaveClass('note-boxx'); 
    expect(contentElement).toHaveAttribute('data-index', '0');
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


  test('displays empty state when no note is selected', async () => {
    await act(async () => {
      render(<Editor {...mockProps} activeNote={null} activeNotebook={null} />);
      jest.runAllTimers();
      await Promise.resolve();
    });
    
    expect(screen.getByText('Welcome to Notia Test.')).toBeInTheDocument();
    expect(screen.getByText('Create a Notebook')).toBeInTheDocument();
  });
});