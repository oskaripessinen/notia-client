import React, {useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import AuthService from "../services/authService";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

const GoogleLoginButton = () => {
  const navigate = useNavigate();

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
        });
    }
  }, [navigate]);

  const handleSuccess = async (credentialResponse) => {
    const result = await AuthService.verifyGoogleToken(credentialResponse.credential);
    if (result.success) {
      navigate("/notes");
    }
  
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      width: '100%',
      
    }}>
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