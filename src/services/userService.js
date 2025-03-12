const BASE_URL = process.env.REACT_APP_API_URL;

// Get user details from array of IDs
const getUsersByIds = async (userIds) => {
  try {
    const response = await fetch(`${BASE_URL}/users/details`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userIds }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user details');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user details:', error);
    throw error;
  }
};

const userService = {
  getUsersByIds
};

export default userService;