const BASE_URL = process.env.REACT_APP_API_URL;
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
        credentials: 'include'
      });
      const data = await response.json();
      return data;
    }catch (error) {
      return { authenticated: false };
    }
  }

  // Logout by making a POST request. The server should clear the cookie.
  static async logout() {
    const response = await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    return await response.json();
    
  }

  // Send Google token to the backend for verification, if needed.
  // You could also have the server set the HttpOnly cookie in the response.
  static async verifyGoogleToken(credential) {
    
    const response = await fetch(`${BASE_URL}/auth/google/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ credential })
    });
    return await response.json();
    
  }
}

export default AuthService;
