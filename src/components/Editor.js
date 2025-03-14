import React, { useRef, useEffect, useCallback, useState } from 'react';
import NoteBox from './NoteBox';
import '../styles/editor.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faCloud, faTrash, faLink, faUserGroup, faLock } from '@fortawesome/free-solid-svg-icons';
import noteService from '../services/noteService';
import ShareModal from './ShareModal';
import userService from '../services/userService';
import socketService from '../services/socketService';

const Editor = ({ notes, handleChange, handleKeyDown, activeNotebook, handleTitleChange, activeNote, handleDeleteNote, setNotes, updateNoteInLocalState }) => {
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

  const handleShareNoteBook = (email) => {
    console.log(`Sharing note with: ${email}`);
    noteService.shareNotebook(activeNotebook._id, [email])
      .then(() => {
        console.log('Notebook shared successfully');
      })
      .catch((error) => {
        console.error('Failed to share notebook:', error);
      });
    
  
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
        // First update local state immediately for a responsive UI
        updateNoteInLocalState(activeNotebook._id, activeNote._id, { 
          title, 
          content 
        });
        
        // Then save to server
        const updatedNote = await noteService.updateNote(
          activeNotebook._id,
          activeNote._id,
          { 
            title, 
            content,
            notebook: activeNotebook._id
          }
        );
        
        // Socket updates for shared notebooks
        const isSharedNotebook = activeNotebook?.users?.length > 1;
        if (isSharedNotebook) {
          socketService.updateNote(activeNotebook._id, activeNote._id, { 
            title, 
            content 
          });
        }
        
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
  }, [activeNotebook, activeNote, setSaveStatus, updateNoteInLocalState]);

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

  useEffect(() => {
    console.log('Joining notebook room:', activeNotebook?._id);
    if (activeNotebook?._id) {
      // Join the notebook room
      socketService.joinNotebook(activeNotebook?._id);
      console.log('Joined notebook room:', activeNotebook?._id);
      
      // Set up handlers for real-time events
      const unsubscribeNoteUpdated = socketService.onEvent('note-updated', (data) => {
        console.log('Remote note update received:', data);
        if (data.noteId === activeNote?._id) {
          // Update the note data if it's the active note
          // This ensures we don't override the user's current changes
          if (data.title) {
            
            console.log(`Remote title update: ${data.title}`);
            
            
          }
          
          if (data.content) {
            console.log('Remote content update received for:', data.content[0]);
            console.log('Current content:', notes.content);
            setNotes({
              title: data.title,
              content: data.content
            });

            console.log('Updated content:', notes.content);
            
            
            
          }
        }
      });
      
      const unsubscribeUserJoined = socketService.onEvent('user-joined', (user) => {
        console.log(`${user.email} joined the notebook`);
        // You could show a notification here
      });
      
      const unsubscribeUserLeft = socketService.onEvent('user-left', (user) => {
        console.log(`${user.email} left the notebook`);
        // You could show a notification here
      });
      
      // Clean up on unmount or when notebook changes
      return () => {
        unsubscribeNoteUpdated();
        unsubscribeUserJoined();
        unsubscribeUserLeft();
      };
    }
  }, [activeNotebook?._id, activeNote?._id]);

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
        
        {activeNote && (
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
        </div>)}
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
        notebook={activeNotebook}  
        onShare={handleShareNoteBook}  
      />
    </div>
  );
};

export default Editor;