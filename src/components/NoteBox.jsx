import React from 'react';
import '../styles/noteBox.css';

const NoteBox = ({ note, index, handleChange, handleKeyDown }) => {
  return (
    <input
      type="text"
      data-index={index}
      className="note-box"
      value={note || ''}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={(e) => handleKeyDown(e)}
      placeholder="Start typing..."
    />
  );
};

export default NoteBox;