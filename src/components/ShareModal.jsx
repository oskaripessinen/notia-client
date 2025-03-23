import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPlus } from '@fortawesome/free-solid-svg-icons';
import '../styles/shareModal.css';
import userService from '../services/userService';

const ShareModal = ({ isOpen, onClose, notebook, onShare, currentUser }) => {
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [error, setError] = useState('');
  
  const [sharing, setSharing] = useState(false);
  const modalRef = useRef(null);
  const emailInputRef = useRef(null);

  useEffect(() => {
    const fetchUserEmails = async () => {
      if (isOpen && notebook) { // Remove the check for notebook.users.length
        try {
          // If no users yet, use an empty array
          const users = notebook.users || [];
          if (users.length > 0) {
            const userDetails = await userService.getUsersByIds(users);
            const userEmails = userDetails
              .map(user => user.email)
              .filter(email => email && email !== currentUser.email);
            setEmails(userEmails);
          } else {
            setEmails([]);
          }
        } catch (error) {
          setError('Failed to load current users');
        }
      }
    };

    if (isOpen) {
      fetchUserEmails();
    }
  }, [isOpen, notebook, currentUser]);

  useEffect(() => {
    if (isOpen && emailInputRef.current) {
      emailInputRef.current.focus();
    }

    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddEmail = async () => {
    if (!currentEmail.trim()) return;

    if (!validateEmail(currentEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (emails.includes(currentEmail)) {
      setError('This email has already been added');
      return;
    }

    try {
      setSharing(true);
      await onShare([currentEmail]);
      setEmails([...emails, currentEmail]);
      setCurrentEmail('');
      setError('');
    } catch (err) {
      setError('Failed to share notebook. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };


  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="share-modal" ref={modalRef}>
        <div className="share-modal-header">
          <h3>Share Notebook</h3>
          <button className="close-button" onClick={onClose} data-testid="close-button">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="share-modal-content">
          <p>Share &ldquo;{notebook?.title || 'Untitled Notebook'}&rdquo; with others</p>
          
          <div className="email-input-container">
            <input
              ref={emailInputRef}
              type="email"
              placeholder="Enter email"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sharing}
            />
            <button 
              className="add-email-button"
              onClick={handleAddEmail}
              disabled={!currentEmail.trim() || sharing}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          {sharing && <div className="info-message">Sharing...</div>}
          
          <div className="email-chips-container">
            {emails.map((email, index) => (
              <div className="email-chip" key={index}>
                {email}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;