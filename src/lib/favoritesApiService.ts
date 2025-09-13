import { API_BASE_URL } from './apiConfig';

// Fetch user favorites
export async function fetchUserFavorites(userId: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/favorites`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error('Failed to fetch favorites');
  }

  return await response.json();
}

// Add to favorites
export async function addToFavorites(type: string, id: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/favorites`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type, id })
  });

  if (!response.ok) {
    throw new Error('Failed to add favorite');
  }

  return await response.json();
}

// Remove from favorites
export async function removeFromFavorites(type: string, id: string, token: string) {
  const response = await fetch(`${API_BASE_URL}/favorites`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ type, id })
  });

  if (!response.ok) {
    throw new Error('Failed to remove favorite');
  }

  return await response.json();
}
