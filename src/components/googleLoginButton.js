import React, {useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import AuthService from "../services/authService";

const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;
console.log("Google Client ID:", clientId);

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
        })
        .catch(err => {
          console.error('Auth check failed:', err);
          navigate('/login');
        });
    }
  }, [navigate]);

  const handleSuccess = async (credentialResponse) => {
    try {
      const result = await AuthService.verifyGoogleToken(credentialResponse.credential);
      console.log("Backend verification result:", result);
      if (result.success) {
        navigate("/notes");
      }
    } catch (error) {
      console.error("Verification failed:", error);
    }
  };

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLogin
        size="large"
        onSuccess={handleSuccess}
        onError={(error) => console.log("Login Failed:", error)}
        useOneTap
        flow="auth-code"
      />
    </GoogleOAuthProvider>
  );
};

export default GoogleLoginButton;