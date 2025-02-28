import React, { useRef, useEffect, useCallback, useState } from 'react';
import NoteBox from './NoteBox';
import '../styles/editor.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faCloud } from '@fortawesome/free-solid-svg-icons';
import noteService from '../services/noteService';

const Editor = ({ notes, handleChange, handleKeyDown, activeNotebook, handleTitleChange, activeNote }) => {
  const titleRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('saved'); 


  const debouncedUpdate = useCallback((title, content) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    setSaveStatus('saving');
    updateTimeoutRef.current = setTimeout(async () => {
      if (!activeNotebook?._id || !activeNote?._id) {
        console.warn('Missing notebook or note ID', { activeNotebook, activeNote });
        setSaveStatus('error');
        return;
      }

      try {
        const updatedNote = await noteService.updateNote(
          activeNotebook._id,
          activeNote.id,
          { 
            title, 
            content,
            notebook: activeNotebook._id
          }
        );
        
        if (updatedNote) {
          setSaveStatus('saved');
        } else {
          setSaveStatus('error');
        }
      } catch (error) {
        console.error('Failed to update note:', error);
        setSaveStatus('error');
      }
    }, 1000); 
  }, [activeNotebook, activeNote]);


  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleTitleUpdate = (e) => {
    const newTitle = e.target.value;
    handleTitleChange(newTitle);
    debouncedUpdate(newTitle, notes.content);
  };

  const handleContentUpdate = (index, value) => {
    if (!Array.isArray(notes.content)) {
      console.error('Notes content is not an array');
      return;
    }
    
    handleChange(index, value);
    
    const newContent = [...notes.content];
    newContent[index] = value;
    debouncedUpdate(notes.title || '', newContent);
  };

  const handleTitleKeyDown = (e) => {
    if ((e.key === 'ArrowDown' || e.key === 'Enter') && notes.content.length > 0) {
      e.preventDefault();
      const firstNoteBox = document.querySelector('[data-index="0"]');
      if (firstNoteBox) firstNoteBox.focus();
    }
  };

  
  const handleNoteBoxKeyDown = (e, index) => {
    if (e.key === 'ArrowUp' && index === 0) {
      e.preventDefault();
      titleRef.current.focus();
    } else {
      handleKeyDown(e, index);
    }
  };

  const renderSaveStatus = () => {
    switch (saveStatus) {
      case 'saving':
        return 'Saving...';
      case 'error':
        return 'Error saving';
      case 'saved':
        return <FontAwesomeIcon size='x' icon={faCloud}/>;
      default:
        return <FontAwesomeIcon size='x' icon={faCloud}/>;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column' }}>
      <div className="editor-toolbar">
        <div style={{ 
          fontSize: '0.8rem',
          color: saveStatus === 'error' ? '#ff4444' : '#666',
        }}>
          {renderSaveStatus()}
        </div>
        <span className='editor-share-button'>
          <FontAwesomeIcon size='xl' icon={faEllipsis} />
        </span>
      </div>
      <div className="editor-header">
        <span className="active-notebook">{activeNotebook?.title || 'Select a notebook'}</span>
      </div>
      <div className="editor-scroll-container">
        <div className="editor-container">
          {activeNotebook && activeNote ? (
            <>
              <input
                ref={titleRef}
                type="text"
                className="note-title"
                value={notes.title || ''}
                onChange={handleTitleUpdate}
                onKeyDown={handleTitleKeyDown}
                placeholder="Untitled"
              />
              {Array.isArray(notes.content) && notes.content.map((noteContent, index) => (
                <NoteBox
                  key={`note-${index}`}
                  note={noteContent}
                  index={index}
                  handleChange={(value) => handleContentUpdate(index, value)}
                  handleKeyDown={(e) => handleNoteBoxKeyDown(e, index)}
                />
              ))}
            </>
          ) : (
            <div className="empty-state">
              <p>Select a notebook to start writing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;