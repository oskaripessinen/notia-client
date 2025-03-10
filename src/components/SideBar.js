import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronDown, faPlus, faEllipsisVertical, faTrash } from '@fortawesome/free-solid-svg-icons';
import noteService from '../services/noteService'; // Import noteService
import '../styles/sidebar.css';

const Sidebar = ({ 
  notebooks, 
  setNotebooks,  
  activeNotebook, 
  setActiveNotebook, 
  activeNote,     
  setActiveNote, 
  user,
  isAddingNotebook,
  setIsAddingNotebook,
  handleAddNotebook 
}) => {
  // State declarations
  const [newNotebookTitle, setNewNotebookTitle] = useState('');
  const [expandedNotebooks, setExpandedNotebooks] = useState({});
  const [addingNoteToNotebook, setAddingNoteToNotebook] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
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
    console.log('Notebook clicked:', notebook._id);
    
    setActiveNotebook({
      ...notebook,
      id: notebook._id,
      _id: notebook._id,
    });
    
    openNotebook(notebook._id);
    
    if (notebook.notes && notebook.notes.length > 0) {
      const firstNote = notebook.notes[0];
      console.log('First note:', firstNote);
      
      // Make sure note has required properties
      if (firstNote && firstNote.id) {
        setActiveNote(notebook, notebook.notes[0]);
      } else {
        console.warn("First note is missing _id", firstNote);
        // Don't continue with an invalid note
        setAddingNoteToNotebook(notebook._id);
      }
    } else {
      console.log("No notes found, adding note input");
      setAddingNoteToNotebook(notebook._id);
      // Clear the active note to avoid any stale references
      setActiveNote(null);
    }
  };

  // Note related functions

  // Update the handleNoteClick function
  const handleNoteClick = (e, note, notebook) => {
    e.stopPropagation();
    
    // Find the note in the notebook to ensure we have all fields
    const fullNote = notebook.notes.find(n => 
      (n.title === note.title && n.content[0] === note.content[0]) || 
      n._id === note._id
    );
    
    if (fullNote) {
      const updatedNote = {
        ...fullNote,
        id: fullNote._id || fullNote.id,
        _id: fullNote._id || fullNote.id,
        notebookId: notebook._id
      };
      
      console.log('Setting active note with IDs:', {
        id: updatedNote.id,
        _id: updatedNote._id,
        notebookId: updatedNote.notebookId
      });
      
      setActiveNotebook(notebook);
      setActiveNote(notebook, updatedNote);
      console.log('Active note:', updatedNote);
    } else {
      console.error('Could not find note in notebook', { note, notebook });
    }
  };

  // Updated handleAddNote function
  const handleAddNote = async (notebookId) => {
    try {
      const newNoteData = {
        title: newNoteTitle || 'Untitled',
        content: ['']
      };
      
      // Create the note on the server
      const createdNote = await noteService.createNote(notebookId, newNoteData);
      
      if (createdNote) {
        console.log("createdNote", createdNote);
        
        // Fetch updated notebooks from the server to get proper IDs
        const updatedNotebooks = await noteService.fetchNotebooks();
        
        if (!updatedNotebooks) {
          console.error('Failed to fetch updated notebooks');
          return;
        }
        
        setNotebooks(updatedNotebooks);
        setAddingNoteToNotebook(null);
        setNewNoteTitle('');
        
        // Find the notebook with the new note
        const updatedNotebook = updatedNotebooks.find(nb => nb._id === notebookId);
        
        if (!updatedNotebook) {
          console.error('Could not find updated notebook', { notebookId });
          return;
        }
        
        // Find the newly created note in the notebook
        const updatedNote = updatedNotebook.notes.find(n => 
          n.title === createdNote.title && 
          (n.createdAt === createdNote.createdAt || n._id === createdNote._id)
        );
        console.log('updatedNote', updatedNote);
        if (updatedNote) {
          setActiveNotebook(updatedNotebook);
          setActiveNote(updatedNotebook, updatedNote);
        } else {
          setActiveNote(activeNotebook.notes[0]);
        }
      }
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  const handleDeleteNote = async (e, noteId, notebookId) => {
    e.stopPropagation();
    const deletedNote = await noteService.deleteNote(notebookId, noteId);
    console.log('Deleted note:', deletedNote);

    const updatedNotebooks = notebooks.map(notebook => {
      if (notebook._id === notebookId) {
        const updatedNotes = notebook.notes.filter(note => note._id !== noteId);
        return {
          ...notebook,
          notes: updatedNotes
        };
      }
      return notebook;
    });
    setNotebooks(updatedNotebooks);

    // If we're deleting the active note
    if (activeNote?._id === noteId) {
      // Find the notebook that had the note deleted
      const notebook = updatedNotebooks.find(nb => nb._id === notebookId);
      
      // If the notebook has other notes, set the first one as active
      if (notebook.notes && notebook.notes.length > 0) {
        setActiveNote({
          ...notebook.notes[0],
          id: notebook.notes[0]._id,
          _id: notebook.notes[0]._id,
          notebookId: notebook._id
        });
      } else {
        // If no notes left, clear the active note
        setActiveNote(null);
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
                    
                  }}
                >
                  <FontAwesomeIcon icon={faEllipsisVertical} size="xs" />
                </button>
                <button 
                  className="notebook-action-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Notebook ID:', notebook._id); // Add this log
                    setAddingNoteToNotebook(notebook._id); // Use _id instead of id
                    openNotebook(notebook._id); // Use openNotebook to ensure it's open
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} size="xs" />
                </button>
              </div>
            </div>
            {expandedNotebooks[notebook._id] && ( // Use _id instead of id
              <div className="notes-list">
                {(notebook.notes || []).map((note, index) => (
                  <div 
                    key={getUniqueKey(notebook, note)}
                    className={`note-item ${
                      (activeNote?._id === note._id) && // Use _id instead of id
                      activeNote?.notebookId === notebook._id ? // Use _id instead of id
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
                      onClick={(e) => handleDeleteNote(e, note._id, notebook._id)} // Use _id instead of id
                    >
                      <FontAwesomeIcon icon={faTrash} size="xs" />
                    </button>
                  </div>
                ))}
                {addingNoteToNotebook === notebook._id && ( // Use _id instead of id
                  <div className="note-input-container">
                    <input
                      type="text"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleAddNote(notebook._id); // Use _id
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