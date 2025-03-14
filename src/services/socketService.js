import { io } from 'socket.io-client';

let socket = null;
let eventHandlers = {};

/**
 * Initialize socket connection
 */
const initSocket = () => {
  if (socket) {
    return socket;
  }
  
  const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  
  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket', 'polling'] // Try both transports
  });
  
  // Add more debugging
  socket.on('connect', () => {
  });
  
  socket.on('disconnect', () => {
  });
  
  socket.on('connect_error', () => {
  });
  
  socket.on('error', () => {
  });
  
  return socket;
};

/**
 * Join a notebook room to receive updates for a specific notebook
 * @param {string} notebookId - ID of the notebook to join
 */
const joinNotebook = (notebookId) => {
  if (!socket) initSocket();
  if (socket.connected) {
    socket.emit('join-notebook', notebookId);
  } else {
    socket.on('connect', () => {
      socket.emit('join-notebook', notebookId);
    });
  }
};

/**
 * Leave a notebook room
 * @param {string} notebookId - ID of the notebook to leave
 */
const leaveNotebook = (notebookId) => {
  if (!socket) {
    return;
  }
  
  if (socket.connected) {
    socket.emit('leave-notebook', notebookId);
  } 
};

/**
 * Send note update to the server
 * @param {string} notebookId - ID of the notebook
 * @param {string} noteId - ID of the note
 * @param {Object} update - Update data (title and/or content)
 * @param {Array} lineChanges - Array of {lineNumber, text} objects for changed lines
 */
const updateNote = (notebookId, noteId, update, lineChanges = []) => {
  if (!socket) initSocket();
  socket.emit('note-update', {
    notebookId,
    noteId,
    ...update,
    lineChanges // Include information about which lines changed
  });
};

/**
 * Send cursor position to other users
 * @param {string} notebookId - ID of the notebook
 * @param {string} noteId - ID of the note
 * @param {Object} position - Cursor position data
 */
const updateCursorPosition = (notebookId, noteId, position) => {
  if (!socket) initSocket();
  socket.emit('cursor-position', {
    notebookId,
    noteId,
    position
  });
};

/**
 * Subscribe to a socket event
 * @param {string} event - Event name
 * @param {Function} handler - Event handler
 * @returns {Function} Unsubscribe function
 */
const onEvent = (event, handler) => {
  if (!socket) initSocket();
  
  // Store handler in our tracking object
  if (!eventHandlers[event]) {
    eventHandlers[event] = [];
  }
  
  eventHandlers[event].push(handler);
  socket.on(event, handler);
  
  // Return unsubscribe function with null check
  return () => {
    if (socket) {
      socket.off(event, handler);
    }
    
    if (eventHandlers[event]) {
      eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
    }
  };
};

/**
 * Add a handler for notebook sync events
 * @param {Function} callback - Callback function to handle notebook sync
 * @returns {Function} Unsubscribe function
 */
const handleNotebookSync = (callback) => {
  if (!socket) initSocket();
  
  socket.on('notebook-sync', (data) => {
    callback(data.notebook);
  });
  
  return () => socket.off('notebook-sync');
};

/**
 * Disconnect socket
 */
const disconnect = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

const socketService = {
  initSocket,
  joinNotebook,
  leaveNotebook, // Add this line
  updateNote,
  updateCursorPosition,
  onEvent,
  handleNotebookSync,
  disconnect
};

export default socketService;