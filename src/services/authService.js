const BASE_URL = process.env.REACT_APP_API_URL;
console.log('BASE_URL:', BASE_URL);
class AuthService {
  // Redirect to Google login (if using a redirect based approach)
  static initiateGoogleLogin() {
    window.location.href = `${BASE_URL}/auth/google`;
  }

  // Check authentication status.
  // The server will verify the HttpOnly cookie and return the auth status.
  static async checkAuthStatus() {
    try {
      const response = await fetch(`${BASE_URL}/auth/status`, {
        credentials: 'include' // Important: sends HttpOnly cookie automatically
      });
      return await response.json();
    } catch (error) {
      console.error('Auth status check failed:', error);
      return { authenticated: false };
    }
  }

  // Logout by making a POST request. The server should clear the cookie.
  static async logout() {
    try {
      const response = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      return await response.json();
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }

  // Send Google token to the backend for verification, if needed.
  // You could also have the server set the HttpOnly cookie in the response.
  static async verifyGoogleToken(credential) {
    try {
      const response = await fetch(`${BASE_URL}/auth/google/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ credential })
      });
      return await response.json();
    } catch (error) {
      console.error('Google verification failed:', error);
      throw error;
    }
  }
}

export default AuthService;
