import { io } from 'socket.io-client';

let socket = null;
let eventHandlers = {};

/**
 * Initialize socket connection
 */
const initSocket = () => {
  console.log('Initializing socket connection...');
  if (socket) {
    console.log('Socket already initialized, returning existing socket');
    return socket;
  }
  
  const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  console.log('Connecting to Socket.IO server at:', SOCKET_URL);
  
  socket = io(SOCKET_URL, {
    withCredentials: true,
    autoConnect: true,
    transports: ['websocket', 'polling'] // Try both transports
  });
  
  // Add more debugging
  socket.on('connect', () => {
    console.log('Socket connected successfully:', socket.id);
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });
  
  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message, error);
  });
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });
  
  return socket;
};

/**
 * Join a notebook room to receive updates for a specific notebook
 * @param {string} notebookId - ID of the notebook to join
 */
const joinNotebook = (notebookId) => {
  console.log('Joining notebook:', notebookId);
  if (!socket) initSocket();
  if (socket.connected) {
    socket.emit('join-notebook', notebookId);
    console.log('Jdadsad:', notebookId);
  } else {
    socket.on('connect', () => {
      socket.emit('join-notebook', notebookId);
      console.log('Jdadsad:', notebookId);
    });
  }
};

/**
 * Leave a notebook room
 * @param {string} notebookId - ID of the notebook to leave
 */
const leaveNotebook = (notebookId) => {
  console.log('Leaving notebook:', notebookId);
  if (!socket) {
    console.warn('Cannot leave notebook: Socket not initialized');
    return;
  }
  
  if (socket.connected) {
    socket.emit('leave-notebook', notebookId);
    console.log('Left notebook room:', notebookId);
  } else {
    console.warn('Cannot leave notebook: Socket not connected');
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
    console.log('Received notebook sync:', data);
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