import { render, screen, fireEvent } from '@testing-library/react';
import Editor from '../Editor';
import { act } from 'react-dom/test-utils';

// Mock socket service
jest.mock('../../services/socketService', () => ({
  joinNotebook: jest.fn(),
  onEvent: jest.fn(() => jest.fn()),
  updateNote: jest.fn(),
}));

// Mock note service
jest.mock('../../services/noteService', () => ({
  updateNote: jest.fn().mockResolvedValue({ _id: 'note1', title: 'Updated Note' }),
  shareNotebook: jest.fn().mockResolvedValue({ success: true }),
}));

// Mock FontAwesome
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>icon</span>
}));

// Mock ShareModal
jest.mock('../ShareModal', () => {
  return function DummyShareModal({ isOpen }) {
    return isOpen ? <div data-testid="share-modal">Share Modal</div> : null;
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
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('renders editor with note title and content', () => {
    render(<Editor {...mockProps} />);
    
    const titleInput = screen.getByDisplayValue('Test Note');
    expect(titleInput).toBeInTheDocument();
    
    // Look for content
    const contentInput = screen.getByDisplayValue('Content line 1');
    expect(contentInput).toBeInTheDocument();
  });

  test('updates title when input changes', () => {
    render(<Editor {...mockProps} />);
    
    const titleInput = screen.getByDisplayValue('Test Note');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    
    expect(mockProps.handleTitleChange).toHaveBeenCalledWith('Updated Title');
  });

  test('shows share modal when share action is selected', async () => {
    render(<Editor {...mockProps} />);
    
    // Open dropdown 
    const dropdownToggle = screen.getByRole('button', { name: /icon/i });
    fireEvent.click(dropdownToggle);
    
    // Select share action - need to find the Share text
    const shareOption = screen.getByText('Share');
    fireEvent.click(shareOption);
    
    // Now the share modal should be visible
    expect(screen.getByTestId('share-modal')).toBeInTheDocument();
  });

  test('displays empty state when no note is selected', () => {
    render(<Editor {...mockProps} activeNote={null} activeNotebook={null} />);
    
    expect(screen.getByText('Select a notebook to start writing')).toBeInTheDocument();
  });
});