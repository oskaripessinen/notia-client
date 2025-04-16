import React, { useRef, useEffect, useState } from 'react';
import '../styles/noteBox.css';

const NoteBox = ({ note, index, handleChange, handleKeyDown, placeholder, onFocus }) => {
  const contentRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  

  useEffect(() => {

    if (contentRef.current && contentRef.current.innerHTML !== note) {
      contentRef.current.innerHTML = note || ''; 
    }
  }, [note]); 

  const handleInput = () => {
    if (contentRef.current) {
      handleChange(contentRef.current.innerHTML);
    }
  };

  const handleFocus = () => {
    setIsExpanded(true);
    if (onFocus) onFocus(index);
  };

  const handleBlur = () => {
    setIsExpanded(false);
  };

  return (
    <div
      ref={contentRef}
      data-index={index}
      className={`note-boxx ${isExpanded ? 'expanded' : ''}`}
      contentEditable
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={(e) => handleKeyDown(e)}
      data-placeholder={placeholder}
      suppressContentEditableWarning={true}
    />
  );
};

export default NoteBox;