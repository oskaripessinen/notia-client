import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import AuthService from "../services/authService";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const GoogleLoginButton = () => {
  const navigate = useNavigate();
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authSuccess = params.get('auth') === 'success';
    
    if (authSuccess) {
      // Clean up the URL
      window.history.replaceState({}, document.title, '/notes');
      
      // Check auth status to confirm
      AuthService.checkAuthStatus()
        .then(data => {
          if (!data.authenticated) {
            navigate('/login');
          }
        })
        .catch(() => {
          setAuthError("Failed to verify authentication status");
        });
    }
  }, [navigate]);

  const handleSuccess = async (credentialResponse) => {
    try {
      const result = await AuthService.verifyGoogleToken(credentialResponse.credential);
      if (result.success) {
        navigate('/notes');
      } else {
        setAuthError("Authentication failed. Please try again.");
      }
    } catch (error) {
      setAuthError("Authentication service unavailable. Please try again later.");
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      width: '100%',
    }}>
      {authError && (
        <div style={{
          color: '#d32f2f',
          backgroundColor: '#ffebee',
          padding: '8px 16px',
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '14px',
          textAlign: 'center',
          width: '100%',
          maxWidth: '325px',
        }}>
          {authError}
        </div>
      )}
      <GoogleOAuthProvider clientId={clientId}>
        <GoogleLogin
          width={325}
          size='large'
          shape='pill'
          onSuccess={handleSuccess}
          useOneTap
          flow="auth-code"
          type='standard'
        />
      </GoogleOAuthProvider>
    </div>
  );
};

export default GoogleLoginButton;