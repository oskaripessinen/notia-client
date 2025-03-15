import { render, screen } from '@testing-library/react';
import App from './App';

// Mock the socketService to avoid actual connections in tests
jest.mock('./services/socketService', () => ({
  initSocket: jest.fn(),
  disconnect: jest.fn(),
}));

test('renders the app with router', () => {
  render(<App />);  // No need to wrap with BrowserRouter
  // App now redirects to login, so we should see login page elements
  expect(screen.getByText(/ideas & plans in one place/i)).toBeInTheDocument();
});
