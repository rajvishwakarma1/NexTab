/**
 * Music API client for fetching currently playing track
 * 
 * Supported Services:
 * - Spotify: Uses Spotify Web API with OAuth access token
 * - YouTube Music: Uses Media Session API or Chrome Extension tab access
 * 
 * Setup Instructions:
 * 
 * Spotify:
 * 1. Go to https://developer.spotify.com/console/get-users-currently-playing-track/
 * 2. Click "Get Token"
 * 3. Select scopes: "user-read-currently-playing" and "user-read-playback-state"
 * 4. Copy the access token
 * 
 * YouTube Music:
 * 1. Enter "media-session" as the token (uses browser's Media Session API)
 * 2. OR enter "extension" to use Chrome Extension tab access
 * 3. Keep YouTube Music playing in a browser tab
 * 4. The widget will automatically detect playback via Media Session API
 * 5. For best results, use Chrome/Edge with YouTube Music web player
 */

class MusicAPI {
    constructor(service, token) {
        this.service = service // 'spotify', 'youtubemusic'
        this.token = token
    }

    /**
     * Get currently playing track from Spotify
     */
    async getSpotifyNowPlaying() {
        try {
            const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            })

            if (response.status === 204 || response.status === 404) {
                return null // Nothing playing
            }

            if (!response.ok) {
                throw new Error(`Spotify API error: ${response.status}`)
            }

            const data = await response.json()

            if (!data || !data.item) {
                return null
            }

            return {
                isPlaying: data.is_playing,
                trackName: data.item.name,
                artist: data.item.artists.map(a => a.name).join(', '),
                album: data.item.album.name,
                albumArt: data.item.album.images[0]?.url,
                duration: data.item.duration_ms,
                progress: data.progress_ms,
                url: data.item.external_urls.spotify
            }
        } catch (error) {
            console.error('Failed to fetch Spotify now playing:', error)
            throw error
        }
    }

    /**
     * Get currently playing track from YouTube Music
     * Uses Chrome Extension API to access YouTube Music tab
     */
    async getYouTubeMusicNowPlaying() {
        try {
            // Method 1: Try Chrome Extension tab access first (most reliable)
            if (this.token === 'extension' || this.token === 'media-session') {
                const tabData = await this.getYouTubeMusicTabData()
                if (tabData) {
                    return tabData
                }
            }

            // If no data found, return null
            console.log('YouTube Music: No playback detected')
            return null
        } catch (error) {
            console.error('Failed to fetch YouTube Music now playing:', error)
            return null
        }
    }

    /**
     * Get YouTube Music data from active tab using extension messaging
     */
    async getYouTubeMusicTabData() {
        try {
            // Check if running in Chrome extension context
            if (typeof chrome === 'undefined' || !chrome.tabs) {
                console.log('YouTube Music: Not in extension context')
                return null
            }

            // Query for YouTube Music tabs
            const tabs = await chrome.tabs.query({ url: '*://music.youtube.com/*' })
            
            if (tabs.length === 0) {
                console.log('YouTube Music: No YouTube Music tabs found')
                return null
            }

            console.log(`YouTube Music: Found ${tabs.length} YouTube Music tab(s)`)

            // Try each tab until we find one with playback
            for (const tab of tabs) {
                try {
                    const results = await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        func: () => {
                            try {
                                // Look for the player bar
                                const player = document.querySelector('ytmusic-player-bar')
                                if (!player) {
                                    return { error: 'Player bar not found' }
                                }

                                // Get video element for actual playback state
                                const video = document.querySelector('video')
                                const isPlaying = video && !video.paused

                                // Extract track info - try multiple selector strategies
                                let titleElement = player.querySelector('.title.ytmusic-player-bar')
                                if (!titleElement) titleElement = player.querySelector('.title')
                                
                                let bylineElement = player.querySelector('.byline.ytmusic-player-bar')
                                if (!bylineElement) bylineElement = player.querySelector('.byline')
                                
                                // Get album art - try multiple strategies
                                let imageElement = player.querySelector('img.image')
                                if (!imageElement) imageElement = player.querySelector('#img')
                                if (!imageElement) imageElement = player.querySelector('yt-img-shadow img')
                                
                                // Get progress from the video element
                                const duration = video ? video.duration * 1000 : 0
                                const progress = video ? video.currentTime * 1000 : 0

                                const title = titleElement?.textContent?.trim()
                                const byline = bylineElement?.textContent?.trim()
                                
                                if (!title) {
                                    return { error: 'No track playing' }
                                }

                                // Parse artist and album from byline (format: "Artist • Album")
                                const bylineParts = byline ? byline.split('•').map(s => s.trim()) : []
                                const artist = bylineParts[0] || 'Unknown Artist'
                                const album = bylineParts[1] || ''

                                // Get image URL - handle both src and srcset
                                let albumArt = ''
                                if (imageElement) {
                                    const imgEl = /** @type {HTMLImageElement} */ (imageElement)
                                    albumArt = imgEl.src || imgEl.getAttribute('src') || ''
                                    // If empty, try getting from srcset
                                    if (!albumArt && imgEl.srcset) {
                                        const srcset = imgEl.srcset.split(',')[0]
                                        albumArt = srcset.split(' ')[0]
                                    }
                                }

                                return {
                                    isPlaying: isPlaying,
                                    trackName: title,
                                    artist: artist,
                                    album: album,
                                    albumArt: albumArt,
                                    duration: duration || 0,
                                    progress: progress || 0,
                                    url: window.location.href
                                }
                            } catch (e) {
                                return { error: e.message }
                            }
                        }
                    })

                    const result = results[0]?.result
                    
                    if (result && !result.error && result.trackName) {
                        console.log('YouTube Music: Successfully extracted playback data', result)
                        return result
                    } else if (result?.error) {
                        console.log(`YouTube Music tab ${tab.id}: ${result.error}`)
                    }
                } catch (e) {
                    console.log(`YouTube Music: Failed to access tab ${tab.id}:`, e.message)
                }
            }

            console.log('YouTube Music: No active playback found in any tab')
            return null
        } catch (error) {
            console.error('Failed to get YouTube Music tab data:', error)
            return null
        }
    }

    /**
     * Get currently playing track based on service
     */
    async getNowPlaying() {
        switch (this.service) {
            case 'spotify':
                return await this.getSpotifyNowPlaying()
            case 'youtubemusic':
                return await this.getYouTubeMusicNowPlaying()
            default:
                return null
        }
    }

    /**
     * Pause playback
     */
    async pause() {
        switch (this.service) {
            case 'spotify':
                await fetch('https://api.spotify.com/v1/me/player/pause', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                })
                break
            case 'youtubemusic':
                // YouTube Music playback control via tab
                await this.controlYouTubeMusicPlayback('pause')
                break
        }
    }

    /**
     * Resume/start playback
     */
    async play() {
        switch (this.service) {
            case 'spotify':
                await fetch('https://api.spotify.com/v1/me/player/play', {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                })
                break
            case 'youtubemusic':
                // YouTube Music playback control via tab
                await this.controlYouTubeMusicPlayback('play')
                break
        }
    }

    /**
     * Skip to next track
     */
    async next() {
        switch (this.service) {
            case 'spotify':
                await fetch('https://api.spotify.com/v1/me/player/next', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                })
                break
            case 'youtubemusic':
                await this.controlYouTubeMusicPlayback('next')
                break
        }
    }

    /**
     * Skip to previous track
     */
    async previous() {
        switch (this.service) {
            case 'spotify':
                await fetch('https://api.spotify.com/v1/me/player/previous', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${this.token}` }
                })
                break
            case 'youtubemusic':
                await this.controlYouTubeMusicPlayback('previous')
                break
        }
    }

    /**
     * Control YouTube Music playback via extension
     */
    async controlYouTubeMusicPlayback(action) {
        try {
            if (typeof chrome === 'undefined' || !chrome.tabs) {
                console.log('YouTube Music controls: Not in extension context')
                return
            }

            const tabs = await chrome.tabs.query({ url: '*://music.youtube.com/*' })
            
            if (tabs.length === 0) {
                console.log('YouTube Music controls: No YouTube Music tabs found')
                return
            }

            const tab = tabs[0]

            await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (controlAction) => {
                    const player = document.querySelector('ytmusic-player-bar')
                    if (!player) return

                    let button
                    switch (controlAction) {
                        case 'play':
                        case 'pause':
                            button = player.querySelector('#play-pause-button')
                            break
                        case 'next':
                            button = player.querySelector('.next-button')
                            break
                        case 'previous':
                            button = player.querySelector('.previous-button')
                            break
                    }

                    if (button) {
                        /** @type {HTMLElement} */ (button).click()
                    }
                },
                args: [action]
            })

            console.log(`YouTube Music: ${action} control executed`)
        } catch (error) {
            console.error('Failed to control YouTube Music playback:', error)
        }
    }
}

export default MusicAPI
