import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faXmark, faPaperPlane, faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';
import '../styles/shareModal.css';
import userService from '../services/userService'; // Create this service

const ShareModal = ({ isOpen, onClose, notebook, onShare }) => {
  const [emails, setEmails] = useState([]);
  const [currentEmail, setCurrentEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const modalRef = useRef(null);
  const emailInputRef = useRef(null);

  // Fetch user emails when modal opens
  useEffect(() => {
    const fetchUserEmails = async () => {
      if (isOpen && notebook && notebook.users && notebook.users.length > 0) {
        try {
          setLoading(true);
          const userDetails = await userService.getUsersByIds(notebook.users);
          const userEmails = userDetails.map(user => user.email).filter(Boolean);
          setEmails(userEmails);
          setLoading(false);
        } catch (error) {
          console.error('Failed to fetch user details:', error);
          setError('Failed to load current users');
          setLoading(false);
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

    // Handle clicking outside to close
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

  // Rest of the functions remain unchanged
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleAddEmail = () => {
    if (!currentEmail.trim()) return;

    if (!validateEmail(currentEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (emails.includes(currentEmail)) {
      setError('This email has already been added');
      return;
    }

    setEmails([...emails, currentEmail]);
    setCurrentEmail('');
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  const handleRemoveEmail = (email) => {
    setEmails(emails.filter(e => e !== email));
  };

  const handleShare = () => {
    if (emails.length === 0) {
      setError('Add at least one email to share with');
      return;
    }

    onShare(emails);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="share-modal" ref={modalRef}>
        <div className="share-modal-header">
          <h3>Share Notebook</h3>
          <button className="close-button" onClick={onClose}>
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="share-modal-content">
          <p>Share "{notebook?.title || 'Untitled Notebook'}" with others</p>
          
          <div className="email-input-container">
            <input
              ref={emailInputRef}
              type="email"
              placeholder="Add email address"
              value={currentEmail}
              onChange={(e) => setCurrentEmail(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button 
              className="add-email-button"
              onClick={handleAddEmail}
              disabled={!currentEmail.trim()}
            >
              <FontAwesomeIcon icon={faPlus} />
            </button>
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
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

        <div className="share-modal-footer">
          <button className="cancel-button" onClick={onClose}>Cancel</button>
          <button 
            className="share-button" 
            onClick={() => handleShare()}
            disabled={emails.length === 0}
          >
            <FontAwesomeIcon icon={faPaperPlane} /> Share
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;