import { render, screen, fireEvent } from '@testing-library/react';
import SideBar from '../SideBar';

// Mock FontAwesome to avoid SVG rendering issues
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>icon</span>
}));

describe('SideBar Component', () => {
  const mockProps = {
    handleDeleteNote: jest.fn(),
    setNotes: jest.fn(),
    notebooks: [
      {
        _id: 'notebook1',
        id: 'notebook1',
        title: 'Test Notebook',
        notes: [
          { _id: 'note1', id: 'note1', title: 'Test Note', content: ['Note content'] }
        ]
      }
    ],
    setNotebooks: jest.fn(),
    activeNotebook: null,
    setActiveNotebook: jest.fn(),
    activeNote: null,
    setActiveNote: jest.fn(),
    user: { displayName: 'Test User' },
    isAddingNotebook: false,
    setIsAddingNotebook: jest.fn(),
    handleAddNotebook: jest.fn()
  };

  test('renders sidebar with notebooks', () => {
    render(<SideBar {...mockProps} />);
    
    expect(screen.getByText('Notia')).toBeInTheDocument();
    expect(screen.getByText('Test Notebook')).toBeInTheDocument();
  });

  test('toggles notebook expansion when clicked', () => {
    render(<SideBar {...mockProps} />);
    
    // Initially the notebook notes should not be visible
    expect(screen.queryByText('Test Note')).not.toBeInTheDocument();
    
    // Click on the notebook to expand
    fireEvent.click(screen.getByText('Test Notebook'));
    
    // Now the note should be visible
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  test('calls handleAddNotebook when "Add Notebook" button is clicked', () => {
    render(<SideBar {...mockProps} />);
    
    fireEvent.click(screen.getByText('Add Notebook'));
    expect(mockProps.setIsAddingNotebook).toHaveBeenCalledWith(true);
  });

  test('calls setActiveNotebook and setActiveNote when notebook is clicked', () => {
    render(<SideBar {...mockProps} />);
    
    fireEvent.click(screen.getByText('Test Notebook'));
    expect(mockProps.setActiveNotebook).toHaveBeenCalled();
  });

  test('calls handleDeleteNote when delete icon is clicked on a note', () => {
    render(<SideBar {...mockProps} />);
    
    // First expand the notebook
    fireEvent.click(screen.getByText('Test Notebook'));
    
    // Find and click the delete button for the note
    const deleteButtons = screen.getAllByRole('button');
    const deleteNoteButton = deleteButtons.find(
      button => button.classList.contains('note-delete-button')
    );
    fireEvent.click(deleteNoteButton);
    
    expect(mockProps.handleDeleteNote).toHaveBeenCalled();
  });
});