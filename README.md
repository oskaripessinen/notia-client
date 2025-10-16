# Notia — React Note‑Taking Client

Notia is a React-based note-taking client featuring real-time collaboration over WebSockets. It offers sharing, OAuth/OIDC sign-in (e.g., Google), REST API integration, and Jest + React Testing Library tests.

## Features
- Fast note editing with a clean UI (Editor, NoteBox, SideBar)
- Real-time updates via WebSockets (socketService)
- Share notes securely
- OAuth 2.0 + OpenID Connect sign-in (Google Sign-In supported)
- Tested with Jest and React Testing Library

## Tech
- React (Create React App)
- WebSockets for live collaboration
- REST API client services (authService, noteService, userService)
- CSS modules in /styles

## Requirements
- Node.js 18+ and npm

## Environment
Create a .env.local in the project root (CRA loads REACT_APP_* vars):
```
REACT_APP_API_BASE_URL=http://localhost:4000
REACT_APP_SOCKET_URL=ws://localhost:4000
# Optional: enable Google Sign-In
REACT_APP_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Notes:
- REACT_APP_API_BASE_URL: Base URL of your backend API.
- REACT_APP_SOCKET_URL: WebSocket endpoint (ws:// or wss://).
- Google Sign-In requires configuring an OAuth 2.0 Client ID in Google Cloud and adding your app origins.

## Getting Started

Install dependencies:
```
npm install
```

Start the dev server:
```
npm start
```
Open http://localhost:3000

Run tests (watch mode):
```
npm test
```

Build for production:
```
npm run build
```

## Project Structure
```
src/
  components/
    AuthModal.jsx
    Editor.jsx
    googleLoginButton.jsx
    NoteBox.jsx
    ShareModal.jsx
    SideBar.jsx
  pages/
    FrontPage.jsx
    Notes.jsx
  services/
    authService.js
    noteService.js
    socketService.js
    userService.js
  styles/        # CSS for components/pages
  assets/        # images/icons
  fonts/
```

## Auth Notes (OAuth vs OIDC)
- OAuth 2.0 provides authorization (tokens).
- OpenID Connect (OIDC) adds identity (sign-in).
- Google Sign-In uses OAuth 2.0 + OIDC; set REACT_APP_GOOGLE_CLIENT_ID to enable.

## Scripts (CRA)
- npm start — Start dev server
- npm test — Run tests in watch mode
- npm run build — Production build
- npm run eject — Eject CRA config (one-way)

