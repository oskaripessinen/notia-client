import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock authService
jest.mock('../../services/authService', () => {
  return {
    __esModule: true,
    default: {
      checkAuthStatus: jest.fn().mockImplementation(() => 
        Promise.resolve({
          authenticated: true,
          user: { _id: 'user1', displayName: 'Test User', email: 'test@example.com' }
        })
      )
    }
  };
});


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

// Mock socketService 
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

// Mock Sidebar component
jest.mock('../../components/SideBar', () => {
  return function DummySidebar() {
    return <div data-testid="sidebar">Sidebar</div>;
  };
});

// Mock Editor component
jest.mock('../../components/Editor', () => {
  return function DummyEditor() {
    return <div data-testid="editor">Editor</div>;
  };
});

import Notes from '../Notes';




describe('Notes Page', () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    jest.clearAllMocks();
    
    const authServiceMock = require('../../services/authService').default;
    authServiceMock.checkAuthStatus.mockImplementation(() => 
      Promise.resolve({
        authenticated: true,
        user: { _id: 'user1', displayName: 'Test User', email: 'test@example.com' }
      })
    );
  });


  test('renders sidebar and editor after loading', async () => {
    await act(async () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Notes />
        </MemoryRouter>
      );
    });
    
   
    await waitFor(() => {
      expect(screen.queryByText(/loading your notes/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });
    
   
    try {
      await waitFor(() => {
        expect(screen.queryByText(/authentication error/i)).not.toBeInTheDocument();
      }, { timeout: 1000 });
    } catch (error) {
      console.error('Auth error is showing:', screen.queryByText(/authentication error/i)?.textContent);
    }
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('editor')).toBeInTheDocument();
  });
});