import axios from 'axios';
import { io } from 'socket.io-client';

const baseUrl = process.env.REACT_APP_API_URL;
const SOCKET_URL = baseUrl;

// Create the Socket.IO connection
const socket = io(SOCKET_URL, {
  transports: ['websocket'],
});

// Fetch a single notebook (including its notes) using an HTTP GET request
const fetchNotebook = async (notebookId) => {
  try {
    const response = await axios.get(`${baseUrl}/notebooks/${notebookId}`, {
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    return null;
  }
};

// Fetch all notebooks for the authenticated user
const fetchNotebooks = async () => {
  try {
    const response = await axios.get(`${baseUrl}/notebooks`, {
      withCredentials: true,
    });
    // Map _id to id consistently
    const notebooksWithId = response.data.map((nb) => ({
      ...nb,
      id: nb._id,
      _id: nb._id, // Keep both for consistency
      notes: nb.notes.map((note) => ({
        ...note,
        id: note.id,
        _id: note.id, // Keep both for consistency
        notebookId: nb._id
      })),
    }));
    return notebooksWithId;
  } catch (err) {
    return null;
  }
};

// Create a new notebook by sending a POST request to the server
const createNotebook = async (title) => {
  try {
    const response = await axios.post(
      `${baseUrl}/notebooks`,
      { title: title || 'Untitled' },
      { withCredentials: true } // Include credentials (cookies)
    );
    return response.data;
  } catch (err) {
    return null;
  }
};

// Modified createNote function
const createNote = async (notebookId, noteData) => {
  try {
    // Don't send client-generated _id
    const { ...dataToSend } = noteData;
    
    const response = await axios.post(
      `${baseUrl}/notebooks/${notebookId}/notes`,
      {
        ...dataToSend,
        notebook: notebookId
      },
      { withCredentials: true }
    );
    
    // Process response to include both id and _id
    const processedData = {
      ...response.data,
      id: response.data._id,
      notebookId: notebookId
    };
    
    return processedData;
  } catch (err) {
    return null;
  }
};

// Update the updateNote function
const updateNote = async (notebookId, noteId, updateData) => {
    if (!notebookId || !noteId) {
      throw new Error('Missing notebook or note ID');
    }

    // Ensure IDs are in the correct format
    const formattedNoteId = noteId.toString();
    const formattedNotebookId = notebookId.toString();
    
    // Clean up the update data to avoid potential schema conflicts
    const cleanedData = {
      title: updateData.title || '',
      content: Array.isArray(updateData.content) ? updateData.content : [''],
      // Don't include the notebook reference to avoid potential conflicts
    };
    
    const response = await axios.put(
      `${baseUrl}/notebooks/${formattedNotebookId}/notes/${formattedNoteId}`,
      cleanedData,
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data) {
      // Map MongoDB _id to id for consistency
      return {
        ...response.data,
        id: response.data._id,
        _id: response.data._id,
        notebookId: formattedNotebookId
      };
    }
};

const deleteNote = async (notebookId, noteId) => {
  try {

    const response = await axios.delete(
      `${baseUrl}/notebooks/${notebookId}/notes/${noteId}`,
      { withCredentials: true }
    );
    
    return response.data;
  } catch (err) {
    return null;
  }
}

// Add the fetchNote function
const fetchNote = async (notebookId, noteId) => {
  try {
    const response = await axios.get(`${baseUrl}/notebooks/${notebookId}/notes/${noteId}`, {
      withCredentials: true
    });
    
    // Ensure consistent ID handling
    return {
      ...response.data,
      id: response.data._id,
      _id: response.data._id,
      notebookId: notebookId
    };
  } catch (err) {
    return null;
  }
};

const shareNotebook = async (notebookId, emails) => {
  
  const response = await axios.post(
    `${baseUrl}/notebooks/${notebookId}/share`,
    { emails },
    { withCredentials: true }
  );
  return response.data;
  
};

// Add method to remove a user from a shared notebook
const removeNotebookShare = async (notebookId, userId) => {
  const response = await axios.delete(
    `${baseUrl}/notebooks/${notebookId}/share/${userId}`,
    { withCredentials: true }
  );
  return response.data;
  
};

// Subscribe to updates for a specific notebook.
const subscribeToNotebookUpdates = (notebookId, callback) => {
  socket.on('notebooksUpdated', (data) => {
    // Check if the update contains notebook data and matches the targeted notebookId
    if (data.notebook && data.notebook._id === notebookId) {
      callback(data.notebook);
    } else if (data.notebookId && data.notebookId === notebookId && data.action === 'delete') {
      // Handle deletion event by notifying that the notebook is gone
      callback(null);
    }
  });
};

// Utility to unsubscribe from updates for the notebook
const unsubscribeFromNotebookUpdates = (callback) => {
  socket.off('notebooksUpdated', callback);
};




const noteService = {
  socket,
  fetchNotebook,
  fetchNotebooks,
  createNotebook,
  createNote,
  updateNote, 
  fetchNote, 
  subscribeToNotebookUpdates,
  unsubscribeFromNotebookUpdates,
  deleteNote,
  shareNotebook,
  removeNotebookShare
};

export default noteService;