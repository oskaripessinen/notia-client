import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FrontPage from './pages/FrontPage';
import Notes from './pages/Notes';
import socketService from './services/socketService';

export default function App() {
  useEffect(() => {
    // Initialize socket connection
    socketService.initSocket();
    
    // Clean up on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<FrontPage />} />
        <Route path="/notes" element={<Notes />} />
      </Routes>
    </BrowserRouter>
  );
}
