import React, { useRef, useEffect, useCallback, useState } from 'react';
import NoteBox from './NoteBox';
import '../styles/editor.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faCloud, faTrash, faLink, faUserGroup, faLock } from '@fortawesome/free-solid-svg-icons';
import noteService from '../services/noteService';
import ShareModal from './ShareModal';
import userService from '../services/userService';

const Editor = ({ notes, handleChange, handleKeyDown, activeNotebook, handleTitleChange, activeNote, handleDeleteNote }) => {
  const titleRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('saved'); 
  const [showDropdown, setShowDropdown] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };

  const handleMenuAction = (action) => {
    setShowDropdown(false);
    
    switch(action) {
      case 'delete':
        // Implement delete functionality
        console.log('Delete note');
        break;
      case 'export':
        // Implement export functionality
        console.log('Export note');
        break;
      case 'print':
        window.print();
        break;
      case 'share':
        setIsShareModalOpen(true);
        break;
      default:
        break;
    }
  };

  const handleShareNote = (emails) => {
    console.log(`Sharing note with: ${emails.join(', ')}`);
    // Here you would implement the API call to share the note
    // For example: noteService.shareNote(activeNotebook._id, activeNote._id, emails);
  };

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

  // Fetch shared users when notebook changes
  useEffect(() => {
    const getSharedUsers = async () => {
      if (activeNotebook?.users?.length > 1) { // More than just the owner
        try {
          const users = await userService.getUsersByIds(activeNotebook.users);
          setSharedUsers(users);
        } catch (error) {
          console.error("Failed to fetch shared users", error);
        }
      } else {
        setSharedUsers([]);
      }
    };
    
    if (activeNotebook) {
      getSharedUsers();
    }
  }, [activeNotebook]);

  return (
    <div style={{ display: 'flex', height: '100%', width: '100%', flexDirection: 'column' }}>
      <div className="editor-header">
        {activeNotebook && (
          <div className="sharing-status" 
               onMouseEnter={() => setShowTooltip(true)}
               onMouseLeave={() => setShowTooltip(false)}>

            {activeNotebook?.users?.length > 1 ? (
              <FontAwesomeIcon icon={faUserGroup} size="sm" className="share-icon" />
            ) : (
              <FontAwesomeIcon icon={faLock} size="sm" className="private-icon" />
            )}
            
            {showTooltip && activeNotebook && (
              <div className="users-tooltip">
                {activeNotebook?.users?.length > 1 ? (
                  <>
                    <h4>Shared with:</h4>
                    <ul className="users-list">
                      {sharedUsers.length > 0 ? (
                        sharedUsers.map(user => (
                          <li key={user._id}>
                            {user.email || user.displayName}
                          </li>
                        ))
                      ) : (
                        <li className="loading-users">Loading users...</li>
                      )}
                    </ul>
                  </>
                ) : (
                  <span>This notebook is private</span>
                )}
              </div>
            )}
            <span className="active-notebook">{activeNotebook?.title || 'Select a notebook'}</span>
          </div>
        )}
        
        {/* Moved toolbar here */}
        <div className="editor-toolbar">
          <div style={{ 
            fontSize: '0.8rem',
            color: saveStatus === 'error' ? '#ff4444' : '#666',
          }}>
            {renderSaveStatus()}
          </div>
          <div className="dropdown-container" ref={dropdownRef}>
            <span className='editor-share-button' onClick={toggleDropdown}>
              <FontAwesomeIcon size='xm' icon={faEllipsis} />
            </span>
            
            {showDropdown && (
              <div className="editor-dropdown">
                <ul>
                  <li onClick={(e) => handleDeleteNote(e, activeNote?._id, activeNotebook?._id)}>
                    <FontAwesomeIcon icon={faTrash} size='sm' /> Delete
                  </li>
                  <li onClick={() => handleMenuAction('share')}>
                    <FontAwesomeIcon icon={faLink} /> Share
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
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
      
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        notebook={activeNotebook}  // Pass the entire notebook object
        onShare={handleShareNote}  // Pass the handleShareNote function
      />
    </div>
  );
};

export default Editor;