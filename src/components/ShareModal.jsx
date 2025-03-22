import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../styles/shareModal.css';
import userService from '../services/userService';

const ShareModal = ({ isOpen, onClose, notebook, onShare }) => {
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [error, setError] = useState('');
  
  const [sharing, setSharing] = useState(false);
  const modalRef = useRef(null);
  const emailInputRef = useRef(null);

  // Fetch user emails when modal opens
  useEffect(() => {
    const fetchUserEmails = async () => {
      if (isOpen && notebook && notebook.users && notebook.users.length > 0) {
        try {
          const userDetails = await userService.getUsersByIds(notebook.users);
          const userEmails = userDetails.map(user => user.email).filter(Boolean);
          setEmails(userEmails);
        } catch (error) {
          setError('Failed to load current users');
        }
      } else if (isOpen) {
        // Reset emails if modal opens without users
        setEmails([]);
      }
    };
    
    fetchUserEmails();
  }, [isOpen, notebook]);

  useEffect(() => {
    // Focus the email input when the modal opens
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
      // Share with just this new email
      await onShare([currentEmail]);
      
      // If sharing successful, update the UI
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

  const handleRemoveEmail = (email) => {
    // Note: This would typically involve an API call to remove share permission
    // For now, we just update the UI
    setEmails(emails.filter(e => e !== email));
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
              placeholder="Enter email and press Enter to share"
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
                <span>{email}</span>
                <button onClick={() => handleRemoveEmail(email)}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;