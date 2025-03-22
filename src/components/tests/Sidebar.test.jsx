import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SideBar from '../SideBar';

// Mock FontAwesome to avoid SVG rendering issues
jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <span>icon</span>
}));

// Helper function to render component with Router
const renderWithRouter = (ui, { route = '/' } = {}) => {
  window.history.pushState({}, 'Test page', route);
  return render(ui, { wrapper: BrowserRouter });
};

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
    handleAddNotebook: jest.fn(),
    setIsShareModalOpen: jest.fn()
  };

  test('renders sidebar with notebooks', () => {
    renderWithRouter(<SideBar {...mockProps} />);
    expect(screen.getByText('Notia')).toBeInTheDocument();
    expect(screen.getByText('Test Notebook')).toBeInTheDocument();
  });

  test('toggles notebook expansion when clicked', () => {
    renderWithRouter(<SideBar {...mockProps} />);
    expect(screen.queryByText('Test Note')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Test Notebook'));
    expect(screen.getByText('Test Note')).toBeInTheDocument();
  });

  test('calls handleAddNotebook when "Add Notebook" button is clicked', () => {
    renderWithRouter(<SideBar {...mockProps} />);
    fireEvent.click(screen.getByText('Add Notebook'));
    expect(mockProps.setIsAddingNotebook).toHaveBeenCalledWith(true);
  });

  test('calls setActiveNotebook and setActiveNote when notebook is clicked', () => {
    renderWithRouter(<SideBar {...mockProps} />);
    fireEvent.click(screen.getByText('Test Notebook'));
    expect(mockProps.setActiveNotebook).toHaveBeenCalled();
  });

  test('calls handleDeleteNote when delete icon is clicked on a note', () => {
    renderWithRouter(<SideBar {...mockProps} />);
    
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