import { render, screen, fireEvent } from '@testing-library/react';
import NoteBox from '../NoteBox';

describe('NoteBox Component', () => {
  const mockProps = {
    note: 'Test note content',
    index: 1,
    handleChange: jest.fn(),
    handleKeyDown: jest.fn(),
  };

  test('renders with correct content', () => {
    render(<NoteBox {...mockProps} />);
    
    const noteInput = screen.getByDisplayValue('Test note content');
    expect(noteInput).toBeInTheDocument();
    expect(noteInput).toHaveAttribute('data-index', '1');
  });

  test('calls handleChange when content changes', () => {
    render(<NoteBox {...mockProps} />);
    
    const noteInput = screen.getByDisplayValue('Test note content');
    fireEvent.change(noteInput, { target: { value: 'Updated content' } });
    
    expect(mockProps.handleChange).toHaveBeenCalledWith('Updated content');
  });

  test('calls handleKeyDown when key is pressed', () => {
    render(<NoteBox {...mockProps} />);
    
    const noteInput = screen.getByDisplayValue('Test note content');
    fireEvent.keyDown(noteInput, { key: 'Enter' });
    
    expect(mockProps.handleKeyDown).toHaveBeenCalled();
  });

  test('renders placeholder when note is empty', () => {
    render(<NoteBox {...mockProps} note="" />);
    
    const noteInput = screen.getByPlaceholderText('Start typing...');
    expect(noteInput).toBeInTheDocument();
  });
});