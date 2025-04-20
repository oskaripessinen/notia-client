import React, { useRef, useEffect, useCallback, useState } from 'react';
import NoteBox from './NoteBox';
import '../styles/editor.css';
import addImg from '../assets/add.png';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis, faCloud, faTrash, faShareNodes, faUserGroup, faLock, faBold, faItalic, faUnderline, faListUl, faHeading } from '@fortawesome/free-solid-svg-icons';
import noteService from '../services/noteService';
import userService from '../services/userService';
import socketService from '../services/socketService';

const Editor = ({ 
  notes,
  handleChange, 
  handleKeyDown, 
  activeNotebook, 
  handleTitleChange, 
  activeNote, 
  handleDeleteNote, 
  setNotes, 
  updateNoteInLocalState,
  setIsShareModalOpen,
  setIsAddingNotebook,
  user,
}) => {
  const titleRef = useRef(null);
  const updateTimeoutRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState('saved'); 
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);
  const [activeNoteBoxIndex, setActiveNoteBoxIndex] = useState(0);
  const [activeFormats, setActiveFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    heading: false,
    ul: false,
    ol: false
  });

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
        break;
      case 'share':
        setIsShareModalOpen(true);
        break;
      default:
        break;
    }
  };

  const debouncedUpdate = useCallback((title, content) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    setSaveStatus('saving');
    
    updateTimeoutRef.current = setTimeout(async () => {
      if (!activeNotebook?._id || !activeNote?._id) {
        setSaveStatus('error');
        return;
      }

      try {
        updateNoteInLocalState(activeNotebook._id, activeNote._id, { 
          title, 
          content 
        });
        
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
      if (firstNoteBox) {
        firstNoteBox.focus();
        // Place cursor at the end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(firstNoteBox);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const handleNoteBoxKeyDown = (e, index) => {
    if (e.key === 'ArrowUp' && index === 0) {
      e.preventDefault();
      titleRef.current.focus();
      // Set cursor at end of title
      titleRef.current.setSelectionRange(titleRef.current.value.length, titleRef.current.value.length);
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
        
          const users = await userService.getUsersByIds(activeNotebook.users);
          setSharedUsers(users);
      }
       else {
        setSharedUsers([]);
      }
    };
    
    if (activeNotebook) {
      getSharedUsers();
    }
  }, [activeNotebook]);

  useEffect(() => {
    if (activeNotebook?._id) {
      // Join the notebook room
      socketService.joinNotebook(activeNotebook?._id);
      
      // Set up handlers for real-time events
      const unsubscribeNoteUpdated = socketService.onEvent('note-updated', (data) => {
        if (data.noteId === activeNote?._id) {
          if (data.content) {
            setNotes({
              title: data.title,
              content: data.content
            });                
          }
        }
      });
      
      const unsubscribeUserJoined = socketService.onEvent('user-joined', () => {
        
      });
      
      const unsubscribeUserLeft = socketService.onEvent('user-left', () => {
      
      });
      
      return () => {
        unsubscribeNoteUpdated();
        unsubscribeUserJoined();
        unsubscribeUserLeft();
      };
    }
  }, [activeNotebook?._id, activeNote?._id, setNotes]);

  const checkActiveFormats = () => {
    if (!document.queryCommandState) return;
    
    setActiveFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      heading: document.queryCommandValue('formatBlock') === 'h1',
      ul: document.queryCommandState('insertUnorderedList'),
      ol: false 
    });
  };

  const handleFormatText = (format) => {
    if (!document.execCommand) {
      return;
    }

    const noteBox = document.querySelector(`[data-index="${activeNoteBoxIndex}"]`);
    if (!noteBox) return;
    
    noteBox.focus();
    
    switch(format) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'heading':
        // First check if we're in a list and exit it if needed
        if (activeFormats.ul) {
          document.execCommand('insertUnorderedList', false, null);
        } else if (activeFormats.ol) {
          document.execCommand('insertOrderedList', false, null);
        }
        
        // Now toggle heading
        if (activeFormats.heading) {
          document.execCommand('formatBlock', false, '<p>');
        } else {
          document.execCommand('formatBlock', false, '<h1>');
        }
        break;
      case 'ul':
        if (activeFormats.heading) {
          document.execCommand('formatBlock', false, '<p>');
        }
        document.execCommand('insertUnorderedList', false, null);
        break;
      case 'ol':
        if (activeFormats.heading) {
          document.execCommand('formatBlock', false, '<p>');
        }
        document.execCommand('insertOrderedList', false, null);
        break;
      default:
        break;
    }
    
    checkActiveFormats();
    
    if (noteBox.innerHTML !== notes.content[activeNoteBoxIndex]) {
      handleContentUpdate(activeNoteBoxIndex, noteBox.innerHTML);
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', checkActiveFormats);
    
    return () => {
      document.removeEventListener('selectionchange', checkActiveFormats);
    };
  }, []);

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
                  <li style={{color: "#ff4444"}} onClick={(e) => handleDeleteNote(e, activeNote?._id, activeNotebook?._id)}>
                    <FontAwesomeIcon icon={faTrash} size='sm' /> Delete
                  </li>
                  <li onClick={() => handleMenuAction('share')}>
                    <FontAwesomeIcon icon={faShareNodes} /> Share
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
              
              <div className="formatting-toolbar global-toolbar">
                <button 
                  className={`format-button ${activeFormats.bold ? 'active' : ''}`}
                  onClick={() => handleFormatText('bold')}
                  aria-label="Bold"
                >
                  <FontAwesomeIcon icon={faBold} />
                </button>
                <button 
                  className={`format-button ${activeFormats.italic ? 'active' : ''}`}
                  onClick={() => handleFormatText('italic')}
                  aria-label="Italic"
                >
                  <FontAwesomeIcon icon={faItalic} />
                </button>
                <button 
                  className={`format-button ${activeFormats.underline ? 'active' : ''}`}
                  onClick={() => handleFormatText('underline')}
                  aria-label="Underline"
                >
                  <FontAwesomeIcon icon={faUnderline} />
                </button>
                <button 
                  className={`format-button ${activeFormats.heading ? 'active' : ''}`}
                  onClick={() => handleFormatText('heading')}
                  aria-label="Heading"
                >
                  <FontAwesomeIcon icon={faHeading} />
                </button>
                <button 
                  className={`format-button ${activeFormats.ul ? 'active' : ''}`}
                  onClick={() => handleFormatText('ul')}
                  aria-label="Bullet List"
                >
                  <FontAwesomeIcon icon={faListUl} />
                </button>
              </div>
              
              {Array.isArray(notes.content) && notes.content.map((noteContent, index) => (
                <div key={`note-container-${index}`} className="note-box-container">
                  <NoteBox
                    key={`note-${index}`}
                    note={noteContent}
                    index={index}
                    handleChange={(value) => handleContentUpdate(index, value)}
                    handleKeyDown={(e) => handleNoteBoxKeyDown(e, index)}
                    placeholder={index === 0 ? "Start typing..." : ""}
                    onFocus={() => setActiveNoteBoxIndex(index)}
                  />
                </div>
              ))}
            </>
          ) : (
            <div className="empty-state">
              
              <p>Welcome to Notia {user.displayName.split(' ')[0]}.</p>
              <button className='create-notebook' onClick={() => setIsAddingNotebook(true)}>
                <img src={addImg} alt="" className="add-button" />
                 Create a Notebook
              </button>
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
};

export default Editor;