import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronDown, faPlus, faEllipsisVertical, faTrash, faShareNodes } from '@fortawesome/free-solid-svg-icons';
import noteService from '../services/noteService'; // Import noteService
import '../styles/sidebar.css';

const Sidebar = ({
  handleDeleteNote,
  notebooks, 
  setNotebooks,  
  activeNotebook, 
  setActiveNotebook, 
  activeNote,     
  setActiveNote, 
  user,
  isAddingNotebook,
  setIsAddingNotebook,
  handleAddNotebook,
  setIsShareModalOpen,
}) => {
  // State declarations
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [expandedNotebooks, setExpandedNotebooks] = useState({});
  const [addingNoteToNotebook, setAddingNoteToNotebook] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [dropdownNotebookId, setDropdownNotebookId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const inputContainerRef = useRef(null);


  // Notebook related functions
  const toggleNotebook = (notebookId) => {
    setExpandedNotebooks(prev => ({
      ...prev,
      [notebookId]: !prev[notebookId]
    }));
  };

  const openNotebook = (notebookId) => {
    setExpandedNotebooks(prev => {
      // Only open if it's not already open
      if (prev[notebookId]) {
        return prev; // No change if already open
      }
      return {
        ...prev,
        [notebookId]: true
      };
    });
  };

  // Updated handleNotebookClick function
  const handleNotebookClick = (notebook) => {    
    setActiveNotebook({
      ...notebook,
      id: notebook._id,
      _id: notebook._id,
    });
    
    openNotebook(notebook._id);
    
    if (notebook.notes && notebook.notes.length > 0) {
      const firstNote = notebook.notes[0];
      
      // Make sure note has required properties
      if (firstNote && firstNote.id) {
        setActiveNote(notebook, notebook.notes[0]);
      } else {
        // Don't continue with an invalid note
        setAddingNoteToNotebook(notebook._id);
      }
    } else {
      setAddingNoteToNotebook(notebook._id);
      // Clear the active note to avoid any stale references
      setActiveNote(null);
    }
  };

  const handleDeleteNotebook = async (notebookId) => {
    const response = await noteService.deleteNotebook(notebookId);
    if (response) {
      const updatedNotebooks = await noteService.fetchNotebooks();
      setNotebooks(updatedNotebooks);
    }
  };

  // Note related functions

  // Update the handleNoteClick function
  const handleNoteClick = async (e, note, notebook) => {
    e.stopPropagation();

      setActiveNotebook(notebook);
      setActiveNote(notebook, note)
  };

  // Updated handleAddNote function
  const handleAddNote = async (notebookId) => {
    
      const newNoteData = {
        title: newNoteTitle || 'Untitled',
        content: ['']
      };
      
      // Create the note on the server
      const createdNote = await noteService.createNote(notebookId, newNoteData);
      
      if (createdNote) {
        
        // Fetch updated notebooks from the server to get proper IDs
        const updatedNotebooks = await noteService.fetchNotebooks();
        
        if (!updatedNotebooks) {
          return;
        }
        
        setNotebooks(updatedNotebooks);
        setAddingNoteToNotebook(null);
        setNewNoteTitle('');
        
        // Find the notebook with the new note
        const updatedNotebook = updatedNotebooks.find(nb => nb._id === notebookId);
        
        if (!updatedNotebook) {
          return;
        }
        
        // Find the newly created note in the notebook
        const updatedNote = updatedNotebook.notes.find(n => 
          n.title === createdNote.title && 
          (n.createdAt === createdNote.createdAt || n._id === createdNote._id)
        );
        if (updatedNote) {
          setActiveNotebook(updatedNotebook);
          setActiveNote(updatedNotebook, updatedNote);
        } else {
          setActiveNote(activeNotebook.notes[0]);
        }
    }
  };


  // Input handling functions
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && newNotebookTitle.trim()) {
      handleAddNotebook(newNotebookTitle.trim());
      setNewNotebookTitle('');
    } else if (e.key === 'Escape') {
      setIsAddingNotebook(false);
      setNewNotebookTitle('');
    }
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputContainerRef.current && !inputContainerRef.current.contains(event.target)) {
        setIsAddingNotebook(false);
        setNewNotebookTitle('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, );

  // Add validation for note IDs
    const getUniqueKey = (notebook, note) => {
      if (!note || !note._id) { // Use _id instead of id
        return `${notebook._id}-note-${Date.now()}-${Math.random()}`; // Use _id instead of id
      }
      return `${notebook._id}-${note._id}`; // Use _id instead of id
    };
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="header-left">
          <h2>Notia</h2>
        </div>
        <div className="header-right">
          <button className="add-button">
            <FontAwesomeIcon icon={faChevronDown} size="xs" />
          </button>
          {user && (
            <div className="user-avatar">
              {user.displayName.split(' ')[0].charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
      <div className="notebooks-list">
        {notebooks.map(notebook => (
          <div key={notebook._id || notebook.id} className="notebook-item">
            <div 
              className="notebook-header"
              onClick={() => handleNotebookClick(notebook)}
              onMouseLeave={() => {
                setDropdownNotebookId(null);
              }}
            >
              <div className="notebook-header-left">
                <span 
                  className={`toggle-icon ${expandedNotebooks[notebook._id] ? 'expanded' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleNotebook(notebook._id); // Use toggle here, not openNotebook
                  }}
                >
                  <FontAwesomeIcon 
                    icon={faChevronRight}
                    size='2xs'
                  />
                </span>
                <span className={`notebook-title ${activeNotebook?._id === notebook._id ? 'active' : ''}`}>
                  {notebook.title}
                </span>
              </div>
              <div className="notebook-header-right">
                <button 
                  className="notebook-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDropdownPosition({ top: e.clientY, left: e.clientX });
                    setDropdownNotebookId(currentId => 
                      currentId === notebook._id ? null : notebook._id
                    );
                  }}
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} size="xs" />
                </button>
                <button 
                  className="notebook-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingNoteToNotebook(notebook._id); 
                    openNotebook(notebook._id); 
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} size="xs" />
                </button>
                {dropdownNotebookId === notebook._id && (
                  <div 
                    className="notebook-dropdown"
                    style={{
                      position: 'fixed',
                      top: `${dropdownPosition.top}px`,
                      left: `${dropdownPosition.left}px`,
                      transform: 'translate(0, 8px)',
                      borderRadius: '4px',
                    }}
                  >

                    <button 
                      className="dropdown-item delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownNotebookId(null);
                        handleDeleteNotebook(notebook._id);
                      }}
                    >
                      <FontAwesomeIcon icon={faTrash} size="xs" />
                      <span>Delete</span>
                    </button>

                    <button 
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDropdownNotebookId(null);
                        setIsShareModalOpen(true);

                      }}
                    >
                      <FontAwesomeIcon icon={faShareNodes} size="xs" />
                      <span>Share</span>
                    </button>
                    
                  </div>
                )}
              </div>
            </div>
            {expandedNotebooks[notebook._id] && ( 
              <div className="notes-list">
                {(notebook.notes || []).map((note) => (
                  <div 
                    key={getUniqueKey(notebook, note)}
                    className={`note-item ${
                      (activeNote?._id === note._id) && 
                      activeNote?.notebookId === notebook._id ?
                      'active' : ''
                    }`}
                  >
                    <div 
                      className="note-content"
                      onClick={(e) => handleNoteClick(e, note, notebook)}
                    >
                      {note.title || 'Untitled'}
                    </div>
                    <button
                      className="note-delete-button"
                      onClick={(e) => handleDeleteNote(e, note._id, notebook._id)}
                    >
                      <FontAwesomeIcon icon={faTrash} size="xs" />
                    </button>
                  </div>
                ))}
                {addingNoteToNotebook === notebook._id && ( 
                  <div className="note-input-container">
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddNote(notebook._id);
                        } else if (e.key === 'Escape') {
                          setAddingNoteToNotebook(null);
                          setNewNoteTitle('');
                        }
                      }}
                      placeholder="New Note"
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {isAddingNotebook && (
          <div 
            ref={inputContainerRef}
            className={`notebook-input-container ${isAddingNotebook ? 'active' : ''}`}
          >
            <input
              type="text"
              className="new-notebook-input"
              value={newNotebookTitle}
              onChange={(e) => setNewNotebookTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="New Notebook"
              autoFocus
            />
            <button 
              className="input-add-button"
              onClick={() => {
                if (newNotebookTitle.trim()) {
                  handleAddNotebook(newNotebookTitle.trim());
                  setNewNotebookTitle('');
                  
                }
              }}
            >
              <FontAwesomeIcon icon={faPlus} size="sm" />
            </button>
          </div>
        )}
      </div>
      {!isAddingNotebook && (
        <button 
          className="add-notebook-button"
          onClick={() => setIsAddingNotebook(true)}
        >
          <FontAwesomeIcon icon={faPlus} size="xs" />
          <span>Add Notebook</span>
        </button>
      )}
    </div>
  );
};

export default Sidebar;