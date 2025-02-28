import React, { useEffect, useState } from 'react';
import AuthService from '../services/authService';
import Sidebar from './SideBar';
import Editor from './Editor';
import noteService from '../services/noteService';
import '../styles/notes.css';

const Notes = () => {
  const [notes, setNotes] = useState({ title: '', content: [''] });
  const [user, setUser] = useState(null);
  const [authStatus, setAuthStatus] = useState(false);
  const [activeNotebook, setActiveNotebook] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  // Initially you might have some dummy notebooks; they will be replaced by server data
  const [notebooks, setNotebooks] = useState([]);
  const [isAddingNotebook, setIsAddingNotebook] = useState(false);

  // Check authentication status and set user
  useEffect(() => {
    console.log('Checking auth status...');
    AuthService.checkAuthStatus().then((data) => {
      if (!data.authenticated) {
        window.location.href = '/login';
      } else {
        setAuthStatus(true);
        setUser(data.user); // Store user data from auth response
      }
    });
  }, []);

  // Once authenticated and user is available, fetch notebooks from the server
  useEffect(() => {
    if (authStatus && user) {
      noteService.fetchNotebooks().then((fetchedNotebooks) => {
        if (fetchedNotebooks) {
          setNotebooks(fetchedNotebooks);
        }
      });
    }
  }, [authStatus, user]);

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

  if (!authStatus) return <div>Loading...</div>;

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
