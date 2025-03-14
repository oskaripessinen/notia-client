import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import GoogleLoginButton from './googleLoginButton';
import '../styles/authModal.css';

function AuthModal({ isOpen, onClose, type, onToggle }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <FontAwesomeIcon style={{ fontSize: "1.5rem" }} icon={faXmark} />
        </button>
        {type === "login" ? (
          <div className="login-form">
            <h2>Log in</h2>
            <h3>to continue to Notia</h3>
            <GoogleLoginButton/>
          </div>
        ) : (
          <div className="register-form">
            <h2>Sign up</h2>
            <h3>to start using Notia</h3>
            <GoogleLoginButton/>
          </div>
        )}
        <div className="toggle-auth" style={{ marginTop: "1rem", fontSize: "0.9rem" }}>
          {type === "login" ? (
            <p style={{ margin: 0 }}>
              No account?{' '}
              <button
                onClick={() => onToggle("signup")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007BFF",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "0.9rem"
                }}
              >
                Sign up
              </button>
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Already have an account?{' '}
              <button
                onClick={() => onToggle("login")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#007BFF",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: "0.9rem"
                }}
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AuthModal;
