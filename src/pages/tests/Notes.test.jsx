import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';


// Mock react-router hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock AuthService as a class with static methods to match the real implementation
jest.mock('../../services/authService', () => {
  return {
    __esModule: true,
    default: class MockAuthService {
      static checkAuthStatus = jest.fn().mockResolvedValue({
        authenticated: true,
        user: { _id: 'user1', displayName: 'Test User', email: 'test@example.com' }
      });
      
      static logout = jest.fn().mockResolvedValue({ success: true });
      
      static verifyGoogleToken = jest.fn().mockResolvedValue({
        success: true,
        user: { _id: 'user1', displayName: 'Test User', email: 'test@example.com' }
      });
      
      static initiateGoogleLogin = jest.fn();
    }
  };
});

// Mock noteService with factory function
jest.mock('../../services/noteService', () => {
  return {
    __esModule: true,
    default: {
      fetchNotebooks: jest.fn().mockResolvedValue([
        {
          _id: 'notebook1',
          id: 'notebook1',
          title: 'Test Notebook',
          users: ['user1'],
          notes: [
            { _id: 'note1', id: 'note1', title: 'Test Note', content: ['Note content'] }
          ]
        }
      ]),
      updateNote: jest.fn(),
      createNote: jest.fn(),
      deleteNote: jest.fn(),
      createNotebook: jest.fn()
    }
  };
});

// Mock socketService with factory function
jest.mock('../../services/socketService', () => {
  return {
    __esModule: true,
    default: {
      joinNotebook: jest.fn(),
      onEvent: jest.fn(() => jest.fn()),
      handleNotebookSync: jest.fn(() => jest.fn())
    }
  };
});

// Mock components
jest.mock('../../components/SideBar', () => {
  return function DummySidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

jest.mock('../../components/Editor', () => {
  return function DummyEditor() {
    return <div data-testid="editor">Editor</div>;
  };
});

import Notes from '../Notes';

// Add this to silence React Router warnings
const originalWarn = console.warn;
console.warn = (...args) => {
  // Filter out specific React Router warnings
  if (
    typeof args[0] === 'string' &&
    (args[0].includes('React Router') ||
     args[0].includes('v7_') ||
     args[0].includes('UNSAFE_'))
  ) {
    return;
  }
  originalWarn(...args);
};

describe('Notes Page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    jest.clearAllMocks();
  });

  test('shows loading state initially', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Notes />
      </MemoryRouter>
    );
    
    expect(screen.getByText('Loading your notes...')).toBeInTheDocument();
  });

  test('renders sidebar and editor after loading', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Notes />
      </MemoryRouter>
    );
    
    // Wait for loading to finish and components to render
    await waitFor(() => {
      expect(screen.queryByText('Loading your notes...')).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
    // Now check for the components
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('editor')).toBeInTheDocument();
  });
});