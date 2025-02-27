import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import FrontPage from './components/FrontPage';
import Notes from './components/Notes';

export default function App() {
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
