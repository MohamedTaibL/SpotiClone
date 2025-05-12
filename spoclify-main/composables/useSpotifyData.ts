import { ref } from 'vue'
import { useAuth } from './useAuth'

export const useSpotifyData = () => {
  const { accessToken, refreshAccessToken } = useAuth()
  const likedSongs = ref([])
  const recentlyPlayed = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const handleApiError = async (response: Response, retryFn: () => Promise<any>) => {
    if (response.status === 401) {
      try {
        await refreshAccessToken()
        return retryFn()
      } catch (err) {
        error.value = 'Session expired. Please login again.'
        throw err
      }
    }
    
    const errorData = await response.json()
    error.value = errorData.error?.message || 'An error occurred'
    throw new Error(error.value)
  }

  const fetchLikedSongs = async () => {
    if (!accessToken.value) {
      error.value = 'No access token available'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`
        }
      })

      if (!response.ok) {
        return handleApiError(response, fetchLikedSongs)
      }

      const data = await response.json()
      likedSongs.value = data.items
    } catch (err) {
      console.error('Error fetching liked songs:', err)
      error.value = 'Failed to fetch liked songs'
      likedSongs.value = []
    } finally {
      isLoading.value = false
    }
  }

  const fetchRecentlyPlayed = async () => {
    if (!accessToken.value) {
      error.value = 'No access token available'
      return
    }

    isLoading.value = true
    error.value = null

    try {
      const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
        headers: {
          'Authorization': `Bearer ${accessToken.value}`
        }
      })

      if (!response.ok) {
        return handleApiError(response, fetchRecentlyPlayed)
      }

      const data = await response.json()
      recentlyPlayed.value = data.items
    } catch (err) {
      console.error('Error fetching recently played:', err)
      error.value = 'Failed to fetch recently played tracks'
      recentlyPlayed.value = []
    } finally {
      isLoading.value = false
    }
  }

  return {
    likedSongs,
    recentlyPlayed,
    isLoading,
    error,
    fetchLikedSongs,
    fetchRecentlyPlayed
  }
} 