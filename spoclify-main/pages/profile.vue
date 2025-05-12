<template>
  <div>
    <div class="flex items-center space-x-6 mb-8">
      <img 
        v-if="userProfile.images?.[0]?.url" 
        :src="userProfile.images[0].url" 
        :alt="userProfile.display_name"
        class="w-32 h-32 rounded-full object-cover"
      />
      <div class="w-32 h-32 bg-gray-600 rounded-full flex items-center justify-center" v-else>
        <svg class="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      </div>
      <div>
        <h1 class="text-3xl font-bold">{{ userProfile.display_name }}</h1>
        <p class="text-gray-400">{{ userProfile.followers?.total }} followers</p>
      </div>
    </div>

    <!-- User Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <div class="bg-gray-800 p-6 rounded-lg">
        <h3 class="text-xl font-semibold mb-4">Top Artists</h3>
        <div class="space-y-4">
          <div v-for="artist in topArtists" :key="artist.id" 
               class="flex items-center space-x-4 cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors"
               @click="navigateToArtist(artist.id)">
            <img 
              v-if="artist.images?.[0]?.url" 
              :src="artist.images[0].url" 
              :alt="artist.name"
              class="w-12 h-12 rounded-full object-cover"
            />
            <div class="w-12 h-12 bg-gray-600 rounded-full" v-else></div>
            <div>
              <p class="font-medium">{{ artist.name }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gray-800 p-6 rounded-lg">
        <h3 class="text-xl font-semibold mb-4">Top Tracks</h3>
        <div class="space-y-4">
          <div v-for="track in topTracks" :key="track.id" 
               class="flex items-center space-x-4 cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors"
               @click="navigateToTrack(track.id)">
            <img 
              v-if="track.album?.images?.[0]?.url" 
              :src="track.album.images[0].url" 
              :alt="track.name"
              class="w-12 h-12 rounded object-cover"
            />
            <div class="w-12 h-12 bg-gray-600 rounded" v-else></div>
            <div>
              <p class="font-medium">{{ track.name }}</p>
              <p class="text-sm text-gray-400">
                <a 
                  @click.stop="navigateToArtist(track.artists[0].id)"
                  class="hover:text-white cursor-pointer transition-colors"
                >
                  {{ track.artists[0].name }}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-gray-800 p-6 rounded-lg">
        <h3 class="text-xl font-semibold mb-4">Recently Played</h3>
        <div class="space-y-4">
          <div v-for="item in recentlyPlayed" :key="item.track.id" 
               class="flex items-center space-x-4 cursor-pointer hover:bg-gray-700 p-2 rounded-lg transition-colors"
               @click="navigateToTrack(item.track.id)">
            <img 
              v-if="item.track.album?.images?.[0]?.url" 
              :src="item.track.album.images[0].url" 
              :alt="item.track.name"
              class="w-12 h-12 rounded object-cover"
            />
            <div class="w-12 h-12 bg-gray-600 rounded" v-else></div>
            <div>
              <p class="font-medium">{{ item.track.name }}</p>
              <p class="text-sm text-gray-400">
                <a 
                  @click.stop="navigateToArtist(item.track.artists[0].id)"
                  class="hover:text-white cursor-pointer transition-colors"
                >
                  {{ item.track.artists[0].name }}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Logout Button -->
    <button
      @click="logout"
      class="bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors"
    >
      Logout
    </button>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

/**
 * @typedef {Object} SpotifyImage
 * @property {string} url - The URL of the image
 */

/**
 * @typedef {Object} SpotifyArtist
 * @property {string} id - The artist's Spotify ID
 * @property {string} name - The artist's name
 * @property {SpotifyImage[]} images - Array of artist images
 */

/**
 * @typedef {Object} SpotifyTrack
 * @property {string} id - The track's Spotify ID
 * @property {string} name - The track's name
 * @property {Object} album - The track's album
 * @property {SpotifyImage[]} album.images - Array of album cover images
 * @property {SpotifyArtist[]} artists - Array of track artists
 */

/**
 * @typedef {Object} SpotifyUserProfile
 * @property {string} display_name - The user's display name
 * @property {SpotifyImage[]} images - Array of user profile images
 * @property {Object} followers - Follower information
 * @property {number} followers.total - Total number of followers
 */

/**
 * @typedef {Object} RecentlyPlayedItem
 * @property {SpotifyTrack} track - The played track
 */

const { accessToken, logout } = useAuth()
const userProfile = ref({})
const topArtists = ref([])
const topTracks = ref([])
const recentlyPlayed = ref([])
const router = useRouter()

// Fetch user profile
const fetchUserProfile = async () => {
  try {
    console.log('Fetching user profile with token:', accessToken.value ? 'Token exists' : 'No token')
    if (!accessToken.value) {
      console.error('No access token available for profile fetch')
      return
    }

    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Profile fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Failed to fetch profile: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    console.log('Profile data received:', data)
    userProfile.value = data
  } catch (error) {
    console.error('Error fetching user profile:', error)
  }
}

// Fetch top artists
const fetchTopArtists = async () => {
  try {
    console.log('Fetching top artists...')
    if (!accessToken.value) {
      console.error('No access token available for top artists fetch')
      return
    }

    const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=5', {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Top artists fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Failed to fetch top artists: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    console.log('Top artists data received:', data)
    topArtists.value = data.items
  } catch (error) {
    console.error('Error fetching top artists:', error)
  }
}

// Fetch top tracks
const fetchTopTracks = async () => {
  try {
    console.log('Fetching top tracks...')
    if (!accessToken.value) {
      console.error('No access token available for top tracks fetch')
      return
    }

    const response = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=5', {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Top tracks fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Failed to fetch top tracks: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    console.log('Top tracks data received:', data)
    topTracks.value = data.items
  } catch (error) {
    console.error('Error fetching top tracks:', error)
  }
}

// Fetch recently played tracks
const fetchRecentlyPlayed = async () => {
  try {
    console.log('Fetching recently played tracks...')
    if (!accessToken.value) {
      console.error('No access token available for recently played fetch')
      return
    }

    const response = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=5', {
      headers: {
        'Authorization': `Bearer ${accessToken.value}`
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Recently played fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      })
      throw new Error(`Failed to fetch recently played: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    console.log('Recently played data received:', data)
    recentlyPlayed.value = data.items
  } catch (error) {
    console.error('Error fetching recently played tracks:', error)
  }
}

// Navigation functions
const navigateToArtist = (id) => {
  router.push(`/artist/${id}`)
}

const navigateToTrack = (id) => {
  router.push(`/track/${id}`)
}

onMounted(async () => {
  if (!accessToken.value) {
    console.error('No access token available')
    return
  }

  try {
    await Promise.all([
      fetchUserProfile(),
      fetchTopArtists(),
      fetchTopTracks(),
      fetchRecentlyPlayed()
    ])
  } catch (error) {
    console.error('Error loading profile data:', error)
  }
})
</script> 