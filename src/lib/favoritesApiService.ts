import { databaseService } from '@/lib/databaseService';

// Fetch user favorites
export async function fetchUserFavorites(userId: string, token: string) {
  try {
    // Make actual API call to fetch favorites
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to fetch favorites');
    }
    
    return {
      success: true,
      data: {
        teams: data.data?.teams || [],
        competitions: data.data?.competitions || [],
        players: data.data?.players || []
      }
    };
  } catch (error) {
    throw new Error('Failed to fetch favorites');
  }
}

// Add to favorites
export async function addToFavorites(type: string, id: string, token: string) {
  try {
    // Make actual API call to add favorite
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        favorite_type: type,
        favorite_id: id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message || 'Favorite added successfully'
    };
  } catch (error) {
    throw new Error('Failed to add favorite');
  }
}

// Remove from favorites
export async function removeFromFavorites(type: string, id: string, token: string) {
  try {
    // Make actual API call to remove favorite
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';
    
    const response = await fetch(`${API_BASE_URL}/favorites`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({
        favorite_type: type,
        favorite_id: id
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    return {
      success: data.success,
      message: data.message || 'Favorite removed successfully'
    };
  } catch (error) {
    throw new Error('Failed to remove favorite');
  }
}