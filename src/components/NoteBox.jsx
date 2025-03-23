import React from 'react';
import '../styles/noteBox.css';

const NoteBox = ({ note, index, handleChange, handleKeyDown, placeholder }) => {
  return (
    <input
      type="text"
      data-index={index}
      className="note-boxx"
      value={note || ''}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={(e) => handleKeyDown(e)}
      placeholder={placeholder}
    />
  );
};

export default NoteBox;