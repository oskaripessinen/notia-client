import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import AuthService from '../services/authService';
import Sidebar from '../components/SideBar';
import Editor from '../components/Editor';
import noteService from '../services/noteService';
import '../styles/notes.css';
import socketService from '../services/socketService';
const Notes = () => {
  const [notes, setNotes] = useState({ title: '', content: [''] });
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState(false);
  const [loading, setLoading] = useState(true); 
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [notebooks, setNotebooks] = useState([]);
  const [isAddingNotebook, setIsAddingNotebook] = useState(false);
  
  const navigate = useNavigate(); 

  // Combine the auth check and data fetching into a single effect
  useEffect(() => {
  

    const initializeApp = async (retryCount = 0) => {
      try {
        const authData = await AuthService.checkAuthStatus();
        if (!authData.authenticated) {          
          // Retry logic - give the session time to establish
          if (retryCount < 2) {
            setTimeout(() => initializeApp(retryCount + 1), 1000);
            return;
          }
          
          navigate('/login');
          return;
        }
        
        setAuthStatus(true);
        setUser(authData.user);
        
        // Now that we have authentication confirmed, fetch notebooks
        const fetchedNotebooks = await noteService.fetchNotebooks();
        
        if (fetchedNotebooks) {
          setNotebooks(fetchedNotebooks);
        } else {
        }
      } catch (error) {
        
        // Retry on network errors
        if (error.message?.includes('network') && retryCount < 2) {
          setTimeout(() => initializeApp(retryCount + 1), 1000);
          return;
        }
        
        navigate('/login'); // Redirect on error after retries
      } finally {
        
        if (retryCount === 2) {
          setLoading(false); // Always mark loading as complete after all retries
        } else {
          // Use a local variable instead of referencing the state
          const isAuthenticated = true; // We're in the success path
          if (isAuthenticated) {
            setLoading(false);
          }
        }
      }
    };
    
    initializeApp();
  }, [navigate]); // Only depend on navigate

  // First, use useCallback to memoize the function to prevent infinite render loops
  const checkForNewNotebooks = useCallback(async () => {
    const fetchedNotebooks = await noteService.fetchNotebooks();
    if (fetchedNotebooks && fetchedNotebooks.length > notebooks.length) {
      setNotebooks(fetchedNotebooks);
    }
  }, [notebooks.length]); // Add notebooks.length as dependency

  // Then update the useEffect with the memoized function in its dependency array
  useEffect(() => {
    // Initial check
    checkForNewNotebooks();
    
    // Set up polling every 15 seconds (changed from 30)
    const pollingInterval = setInterval(() => {
      checkForNewNotebooks();
    }, 15000); // 15 seconds
    
    return () => clearInterval(pollingInterval);
  }, [checkForNewNotebooks]); // Include checkForNewNotebooks in the dependency array

  useEffect(() => {
    // Initial auth check when component loads
    checkAuthStatus();
    
    // Set up periodic authentication check
    const authCheckInterval = setInterval(checkAuthStatus, 10000); // Check every 10 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(authCheckInterval);
    
    function checkAuthStatus() {
      AuthService.checkAuthStatus()
        .then(response => {
          if (!response.authenticated) {
            // Clear any client-side auth state
            localStorage.removeItem("userLoggedIn");
            // Redirect to login
            navigate("/login");
          }
        })
        .catch(error => {
          navigate("/login");
        });
    }
  }, [navigate]);

  useEffect(() => {
    if (activeNotebook?._id) {
      // Set up sync handler
      const unsubscribeSyncHandler = socketService.handleNotebookSync((updatedNotebook) => {
        setActiveNotebook(updatedNotebook);
        
        // If we have an active note, find its updated version
        if (activeNote?._id) {
          const updatedNote = updatedNotebook.notes.find(n => n._id === activeNote._id);
          if (updatedNote) {
            setActiveNote({ ...updatedNote, notebookId: updatedNotebook._id });
            setNotes({
              title: updatedNote.title || '',
              content: updatedNote.content || ['']
            });
          }
        }
      });
      
      // Clean up
      return () => {
        unsubscribeSyncHandler();
      };
    }
  }, [activeNotebook?._id, activeNote?._id]);

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const newNotes = [...notes.content];
      newNotes.splice(index + 1, 0, '');
      setNotes({
        ...notes,
        content: newNotes
      });
      setTimeout(() => {
        const nextTextarea = document.querySelector(`[data-index="${index + 1}"]`);
        if (nextTextarea) nextTextarea.focus();
      }, 0);
    } else if (e.key === 'Backspace' && !notes.content[index] && notes.content.length > 1) {
      e.preventDefault();
      const newNotes = [...notes.content];
      newNotes.splice(index, 1);
      setNotes({
        ...notes,
        content: newNotes
      });
      setTimeout(() => {
        const prevTextarea = document.querySelector(`[data-index="${index - 1}"]`);
        if (prevTextarea) prevTextarea.focus();
      }, 0);
    } else if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault();
      const prevTextarea = document.querySelector(`[data-index="${index - 1}"]`);
      if (prevTextarea) prevTextarea.focus();
    } else if (e.key === 'ArrowDown' && index < notes.content.length - 1) {
      e.preventDefault();
      const nextTextarea = document.querySelector(`[data-index="${index + 1}"]`);
      if (nextTextarea) nextTextarea.focus();
    }
  };

  const handleChange = (index, value) => {
    const newNotes = [...notes.content];
    newNotes[index] = value;
    setNotes({
      ...notes,
      content: newNotes
    });

    if (activeNotebook && activeNote) {
      const updatedNotebooks = notebooks.map(notebook => {
        if (notebook.id === activeNotebook.id) {
          const updatedNotes = notebook.notes.map(note => {
            if (note.id === activeNote.id) {
              return { ...note, content: newNotes };
            }
            return note;
          });
          return { ...notebook, notes: updatedNotes };
        }
        return notebook;
      });
      setNotebooks(updatedNotebooks);
    }
  };

  const handleNotebookSelect = (notebook) => {
    setActiveNotebook(notebook);
    if (notebook.notes && notebook.notes.length > 0) {
      setNotes({
        title: notebook.notes[0].title,
        content: notebook.notes[0].content
      });
    } else {
      setNotes({
        title: '',
        content: ['']
      });
    }
  };

  const handleDeleteNote = async (e, noteId, notebookId) => {
    e.stopPropagation();
    const deletedNote = await noteService.deleteNote(notebookId, noteId);

    // Find the notebook and the index of the note being deleted
    const notebook = notebooks.find(nb => nb._id === notebookId);
    const deletedNoteIndex = notebook.notes.findIndex(note => note._id === noteId);
    
    // Update notebooks state with note removed
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
      // Get the updated notebook after deletion
      const updatedNotebook = updatedNotebooks.find(nb => nb._id === notebookId);
      
      // If there are still notes left in the notebook
      if (updatedNotebook.notes && updatedNotebook.notes.length > 0) {
        // Try to get the previous note (if it exists)
        let nextActiveNote;
        
        // If the deleted note wasn't the first one, get the previous note
        if (deletedNoteIndex > 0) {
          nextActiveNote = updatedNotebook.notes[deletedNoteIndex - 1];
        } else {
          // Otherwise, get the new first note
          nextActiveNote = updatedNotebook.notes[0];
        }
        
        setActiveNote({
          ...nextActiveNote,
          id: nextActiveNote._id,
          _id: nextActiveNote._id,
          notebookId: updatedNotebook._id
        });
        
        setNotes({
          title: nextActiveNote.title || '',
          content: nextActiveNote.content || ['']
        });
      } else {
        // If no notes left, clear the active note
        setActiveNote(null);
        setNotes({
          title: '',
          content: ['']
        });
      }
    }
  };

  // Update the handleNoteSelect function to safely handle undefined notes
  const handleNoteSelect = (notebook, note) => {
    // Check if notebook exists but note is undefined
    if (notebook && !note) {
      
      // If the notebook has notes, select the first one
      if (notebook.notes && notebook.notes.length > 0) {
        const firstNote = notebook.notes[0];
        // Make sure the note has _id
        if (firstNote && firstNote._id) {
          setActiveNote({
            ...firstNote,
            id: firstNote._id,
            _id: firstNote._id,
            notebookId: notebook._id
          });
          
          setNotes({
            title: firstNote.title || '',
            content: firstNote.content || ['']
          });
        } else {
          // No valid first note, set empty state
          setActiveNote(null);
          setNotes({
            title: '',
            content: ['']
          });
        }
      } else {
        // Empty notebook, set empty state
        setActiveNote(null);
        setNotes({
          title: '',
          content: ['']
        });
      }
      
      return;
    }
    
    // Original function logic for when both notebook and note are defined
    // Check if both notebook and note are defined
    if (!notebook || !note) {
      return;
    }
    
    // Verify that note has the _id property
    if (!note._id) {
      
      // Try to find a matching note with _id in the notebook
      if (notebook.notes && notebook.notes.length > 0) {
        const matchingNote = notebook.notes.find(
          n => n.title === note.title || 
               (n.content && note.content && n.content[0] === note.content[0])
        );
        
        if (matchingNote && matchingNote._id) {
          // Use the matching note with proper _id
          setActiveNote({
            ...matchingNote,
            id: matchingNote._id,
            _id: matchingNote._id,
            notebookId: notebook._id
          });
          
          // THIS LINE WAS MISSING - Update the notes state with the content
          setNotes({
            title: matchingNote.title || '',
            content: matchingNote.content || ['']
          });
          return;
        }
      }
      
      // If still no _id, don't proceed
      return;
    }
    
    // Now we can safely use note._id
    setActiveNote({
      ...note,
      id: note._id,
      _id: note._id,
      notebookId: notebook._id
    });
    
    // THIS LINE WAS MISSING - Update the notes state with the content
    setNotes({
      title: note.title || '',
      content: note.content || ['']
    });
  };

  const handleTitleChange = (newTitle) => {
    if (activeNotebook) {
      const updatedNotebooks = notebooks.map(notebook => {
        if (notebook.id === activeNotebook.id) {
          const updatedNotes = [...notebook.notes];
          if (updatedNotes[0]) {
            updatedNotes[0] = { ...updatedNotes[0], title: newTitle };
          }
          return { ...notebook, notes: updatedNotes };
        }
        return notebook;
      });
      setNotebooks(updatedNotebooks);
      setNotes({ ...notes, title: newTitle });
    }
  };

  const handleAddNotebook = async (title) => {
    const createdNotebook = await noteService.createNotebook(title);
    if (createdNotebook) {
      setNotebooks(prev => [...prev, createdNotebook]);
      setIsAddingNotebook(false);
    }
  };

  // Add this function to update notebooks whenever a note is edited
  const updateNoteInLocalState = (notebookId, noteId, updates) => {
    setNotebooks(prevNotebooks => {
      return prevNotebooks.map(notebook => {
        // If this is not the notebook containing our note, return it unchanged
        if (notebook._id !== notebookId) return notebook;
        
        // Otherwise, update the specific note in this notebook
        const updatedNotes = notebook.notes.map(note => {
          if (note._id !== noteId) return note;
          
          // Return the updated note
          return {
            ...note,
            ...updates,
            // Ensure IDs are preserved
            _id: note._id,
            id: note._id
          };
        });
        
        // Return the notebook with updated notes array
        return {
          ...notebook,
          notes: updatedNotes
        };
      });
    });
  };

  // Update your return statement to handle loading state
  if (loading) {
    return <div className="loading-container">
            <div className="loading-spinner"></div>
            <div className="loading-text">Loading your notes...</div>
          </div>;
  }

  if (!authStatus) {
    return <div className="auth-error">Authentication error. Please log in again.</div>;
  }

  return (
    <div className="notes-container">
      <Sidebar 
        setNotes={setNotes}
        notebooks={notebooks}
        setNotebooks={setNotebooks} 
        activeNotebook={activeNotebook}
        setActiveNotebook={handleNotebookSelect}
        activeNote={activeNote}
        setActiveNote={handleNoteSelect}
        isAddingNotebook={isAddingNotebook}
        setIsAddingNotebook={setIsAddingNotebook}
        handleAddNotebook={handleAddNotebook}
        user={user}
        handleDeleteNote={handleDeleteNote}
      />
      <Editor 
        activeNote={activeNote}
        notes={notes}
        handleChange={handleChange}
        handleKeyDown={handleKeyDown}
        handleTitleChange={handleTitleChange}
        activeNotebook={activeNotebook}
        handleDeleteNote={handleDeleteNote}
        setNotes={setNotes}
        updateNoteInLocalState={updateNoteInLocalState}
      />
    </div>
  );
};

export default Notes;
