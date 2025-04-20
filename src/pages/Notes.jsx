import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom'; 
import AuthService from '../services/authService';
import Sidebar from '../components/SideBar';
import Editor from '../components/Editor';
import ShareModal from '../components/ShareModal';
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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const navigate = useNavigate(); 

  useEffect(() => {
    const initializeApp = async (retryCount = 0) => {
      try {
        const authData = await AuthService.checkAuthStatus();
        if (!authData.authenticated) {          
          if (retryCount < 2) {
            setTimeout(() => initializeApp(retryCount + 1), 1000);
            return;
          }
          
          navigate('/login');
          return;
        }
        
        setAuthStatus(true);
        setUser(authData.user);
        
        const fetchedNotebooks = await noteService.fetchNotebooks();
        
        if (fetchedNotebooks) {
          setNotebooks(fetchedNotebooks);
        }
      } catch (error) {
        if (error.message?.includes('network') && retryCount < 2) {
          setTimeout(() => initializeApp(retryCount + 1), 1000);
          return;
        }
        
        navigate('/login'); 
      } finally {
        setLoading(false);
      }
    };
    
    initializeApp();
  }, [navigate]);

  const checkForNewNotebooks = useCallback(async () => {
    const fetchedNotebooks = await noteService.fetchNotebooks();
    if (fetchedNotebooks && fetchedNotebooks.length > notebooks.length) {
      setNotebooks(fetchedNotebooks);
    }
  }, [notebooks.length]); 

  useEffect(() => {
    checkForNewNotebooks();
    const pollingInterval = setInterval(() => {
      checkForNewNotebooks();
    }, 15000);
    
    return () => clearInterval(pollingInterval);
  }, [checkForNewNotebooks]);

  useEffect(() => {
    checkAuthStatus();
    const authCheckInterval = setInterval(checkAuthStatus, 10000); // Check every 10 seconds
    return () => clearInterval(authCheckInterval);
    
    async function checkAuthStatus() {
      const authStatus = await AuthService.checkAuthStatus()
      
        if (!authStatus || !authStatus.authenticated) {
          navigate("/login");
        }
        
    }
  }, [navigate]);

  useEffect(() => {
    if (activeNotebook?._id) {
      const unsubscribeSyncHandler = socketService.handleNotebookSync((updatedNotebook) => {
        setActiveNotebook(updatedNotebook);
        
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
      const isInsideUL = document.queryCommandState('insertUnorderedList');

      if (isInsideUL) {
        e.preventDefault(); // Estä oletustoiminto (uusi <li> samaan laatikkoon)
        
        const currentNotesContent = Array.isArray(notes.content) ? [...notes.content] : [];
        currentNotesContent.splice(index + 1, 0, ''); // Lisää tyhjä paikka uudelle laatikolle

        setNotes(prevNotes => ({
          ...prevNotes,
          content: currentNotesContent
        }));

        setTimeout(() => {
          const nextTextarea = document.querySelector(`[data-index="${index + 1}"]`);
          if (nextTextarea) {
            nextTextarea.focus();
            
            document.execCommand('insertUnorderedList', false, null);

            const newContentHTML = nextTextarea.innerHTML; 

            setNotes(prevNotes => {
              const updatedContent = [...prevNotes.content];
              if (updatedContent[index + 1] !== undefined) {
                updatedContent[index + 1] = newContentHTML;
              }
              return {
                ...prevNotes,
                content: updatedContent
              };
            });
          }
        }, 50);

        return;
      }

      e.preventDefault(); 
      const originalNotesContent = Array.isArray(notes.content) ? [...notes.content] : [];
      originalNotesContent.splice(index + 1, 0, '');
      setNotes({
        ...notes,
        content: originalNotesContent
      });
      setTimeout(() => {
        const nextTextarea = document.querySelector(`[data-index="${index + 1}"]`);
        if (nextTextarea) {
          nextTextarea.focus();
        }
      }, 50);

    } else if (e.key === 'Backspace' && notes.content.length > 1) {
      const selection = window.getSelection();
      const noteBox = document.querySelector(`[data-index="${index}"]`);

      const isAtStart = selection && noteBox && selection.anchorOffset === 0 &&
                        selection.focusOffset === 0 &&
                        selection.containsNode(noteBox, true) &&
                        (!selection.anchorNode || !selection.anchorNode.previousSibling || selection.anchorNode === noteBox);

      const isEmpty = !notes.content[index] ||
                      notes.content[index].trim() === '' ||
                      notes.content[index].trim() === '<br>';

      if (isAtStart && isEmpty) {
        e.preventDefault();

        const newNotes = [...notes.content];
        newNotes.splice(index, 1);

        setNotes(prevNotes => ({
          ...prevNotes,
          content: newNotes
        }));

        setTimeout(() => {
          const prevIndex = Math.max(0, index - 1);
          const prevTextarea = document.querySelector(`[data-index="${prevIndex}"]`);
          if (prevTextarea) {
            prevTextarea.focus();
            const range = document.createRange();
            const sel = window.getSelection();
            range.selectNodeContents(prevTextarea);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }, 50);
      }
    } else if (e.key === 'ArrowUp' && index > 0) {
       e.preventDefault();
      const prevTextarea = document.querySelector(`[data-index="${index - 1}"]`);
      if (prevTextarea) {
        prevTextarea.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(prevTextarea);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    } else if (e.key === 'ArrowDown' && index < notes.content.length - 1) {
      e.preventDefault();
      const nextTextarea = document.querySelector(`[data-index="${index + 1}"]`);
      if (nextTextarea) {
        nextTextarea.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(nextTextarea);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
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

  const handleShareNoteBook = async (email) => {
    const response = await noteService.shareNotebook(activeNotebook._id, [email]);
    
    if (!response || !response.notebook) {
      throw new Error('Invalid response from server');
    }

    setActiveNotebook(response.notebook);

    setNotebooks(prevNotebooks => 
      prevNotebooks.map(nb => 
        nb._id === response.notebook._id ? response.notebook : nb
      )
    );
  };

  const handleDeleteNote = async (e, noteId, notebookId) => {
    e.stopPropagation();

    await noteService.deleteNote(notebookId, noteId);
    const notebook = notebooks.find(nb => nb._id === notebookId);
    const deletedNoteIndex = notebook.notes.findIndex(note => note._id === noteId);
    
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

    if (activeNote?._id === noteId) {
      const updatedNotebook = updatedNotebooks.find(nb => nb._id === notebookId);
      
      if (updatedNotebook.notes && updatedNotebook.notes.length > 0) {
        let nextActiveNote;
        
        if (deletedNoteIndex > 0) {
          nextActiveNote = updatedNotebook.notes[deletedNoteIndex - 1];
        } else {
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
        setActiveNote(null);
        setNotes({
          title: '',
          content: ['']
        });
      }
    }
  };

  const handleNoteSelect = (notebook, note) => {
    if (notebook && !note) {
      if (notebook.notes && notebook.notes.length > 0) {
        const firstNote = notebook.notes[0];
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
          setActiveNote(null);
          setNotes({
            title: '',
            content: ['']
          });
        }
      } else {
        setActiveNote(null);
        setNotes({
          title: '',
          content: ['']
        });
      }
      
      return;
    }
    
    if (!notebook || !note) {
      return;
    }
    
    if (!note._id) {
      if (notebook.notes && notebook.notes.length > 0) {
        const matchingNote = notebook.notes.find(
          n => n.title === note.title || 
               (n.content && note.content && n.content[0] === note.content[0])
        );
        
        if (matchingNote && matchingNote._id) {
          setActiveNote({
            ...matchingNote,
            id: matchingNote._id,
            _id: matchingNote._id,
            notebookId: notebook._id
          });
          
          setNotes({
            title: matchingNote.title || '',
            content: matchingNote.content || ['']
          });
          return;
        }
      }
      
      return;
    }
    
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

  const updateNoteInLocalState = (notebookId, noteId, updates) => {
    setNotebooks(prevNotebooks => {
      return prevNotebooks.map(notebook => {
        if (notebook._id !== notebookId) return notebook;
        
        const updatedNotes = notebook.notes.map(note => {
          if (note._id !== noteId) return note;
          
          return {
            ...note,
            ...updates,
            _id: note._id,
            id: note._id
          };
        });
        
        return {
          ...notebook,
          notes: updatedNotes
        };
      });
    });
  };

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
        setIsShareModalOpen={setIsShareModalOpen}
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
        setIsShareModalOpen={setIsShareModalOpen}
        setIsAddingNotebook={setIsAddingNotebook}
        user={user}
      />
      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        notebook={activeNotebook}  
        onShare={handleShareNoteBook}  
        currentUser={user}
      />
    </div>
  );
};

export default Notes;
