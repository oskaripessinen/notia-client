import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import AuthService from '../services/authService';
import Sidebar from './SideBar';
import Editor from './Editor';
import noteService from '../services/noteService';
import '../styles/notes.css';

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
        console.log(`Checking auth status... (attempt ${retryCount + 1})`);
        const authData = await AuthService.checkAuthStatus();
        
        if (!authData.authenticated) {
          console.log('Not authenticated response:', authData);
          
          // Retry logic - give the session time to establish
          if (retryCount < 2) {
            console.log(`Authentication failed, retrying in 1 second... (${retryCount + 1}/3)`);
            setTimeout(() => initializeApp(retryCount + 1), 1000);
            return;
          }
          
          console.log('Authentication failed after retries, redirecting to login');
          navigate('/login');
          return;
        }
        
        console.log('User authenticated:', authData.user);
        setAuthStatus(true);
        setUser(authData.user);
        
        // Now that we have authentication confirmed, fetch notebooks
        console.log('Fetching notebooks...');
        const fetchedNotebooks = await noteService.fetchNotebooks();
        
        if (fetchedNotebooks) {
          console.log('Notebooks fetched:', fetchedNotebooks.length);
          setNotebooks(fetchedNotebooks);
        } else {
          console.log('No notebooks returned or error fetching notebooks');
        }
      } catch (error) {
        console.error('Error during initialization:', error);
        
        // Retry on network errors
        if (error.message?.includes('network') && retryCount < 2) {
          console.log(`Network error, retrying in 1 second... (${retryCount + 1}/3)`);
          setTimeout(() => initializeApp(retryCount + 1), 1000);
          return;
        }
        
        navigate('/login'); // Redirect on error after retries
      } finally {
        // Modify this to avoid the authStatus dependency
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

  // Update the handleNoteSelect function to safely handle undefined notes
  const handleNoteSelect = (notebook, note) => {
    // Check if notebook exists but note is undefined
    if (notebook && !note) {
      console.log('Notebook selected without a note, showing first note or empty state');
      
      // If the notebook has notes, select the first one
      if (notebook.notes && notebook.notes.length > 0) {
        
        // Make sure the note has _id
        if (note && note._id) {
          setActiveNote({
            ...note,
            id: note._id,
            _id: note._id,
            notebookId: notebook._id
          });
          
          setNotes({
            title: note.title || '',
            content: note.content || ['']
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
      console.warn('Missing notebook or note in handleNoteSelect', { notebook, note });
      return;
    }
    
    // Verify that note has the _id property
    if (!note._id) {
      console.warn('Note is missing _id property', note);
      
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

  // Update your return statement to handle loading state
  if (loading) {
    return <div className="loading-container">Loading application...</div>;
  }

  if (!authStatus) {
    return <div className="auth-error">Authentication error. Please log in again.</div>;
  }

  return (
    <div className="notes-container">
      <Sidebar 
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
      />
      <Editor 
        activeNote={activeNote}
        notes={notes}
        handleChange={handleChange}
        handleKeyDown={handleKeyDown}
        handleTitleChange={handleTitleChange}
        activeNotebook={activeNotebook} 
      />
    </div>
  );
};

export default Notes;
