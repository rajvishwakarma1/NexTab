<script>
    import { onMount, onDestroy } from 'svelte'
    import { fade } from 'svelte/transition'
    import MusicAPI from '../music-api.js'
    import { settings } from '../settings-store.svelte.js'

    let nowPlaying = $state(null)
    let loading = $state(true)
    let error = $state('')
    let pollInterval = null

    async function loadNowPlaying() {
        if (!settings.musicService || !settings.musicToken) {
            error = 'no music service configured'
            loading = false
            return
        }

        try {
            error = ''
            const api = new MusicAPI(settings.musicService, settings.musicToken)
            nowPlaying = await api.getNowPlaying()
            loading = false
        } catch (err) {
            error = 'failed to load'
            console.error(err)
            loading = false
        }
    }

    onMount(() => {
        loadNowPlaying()
        // Poll every 5 seconds to update progress and check for new tracks
        pollInterval = setInterval(loadNowPlaying, 5000)
    })

    onDestroy(() => {
        if (pollInterval) {
            clearInterval(pollInterval)
        }
    })

    async function togglePlayPause(event) {
        event.preventDefault()
        event.stopPropagation()
        
        if (!settings.musicService || !settings.musicToken) return

        try {
            const api = new MusicAPI(settings.musicService, settings.musicToken)
            
            if (nowPlaying?.isPlaying) {
                await api.pause()
            } else {
                await api.play()
            }
            
            // Refresh after a short delay
            setTimeout(loadNowPlaying, 500)
        } catch (err) {
            console.error('Failed to toggle playback:', err)
        }
    }

    async function skipTrack(event, direction) {
        event.preventDefault()
        event.stopPropagation()
        
        if (!settings.musicService || !settings.musicToken) return

        try {
            const api = new MusicAPI(settings.musicService, settings.musicToken)
            
            if (direction === 'next') {
                await api.next()
            } else {
                await api.previous()
            }
            
            // Refresh after a short delay
            setTimeout(loadNowPlaying, 500)
        } catch (err) {
            console.error('Failed to skip track:', err)
        }
    }
</script>

<div class="music-widget">
    {#if error}
        <div class="message" transition:fade>🎵 {error}</div>
    {:else if loading}
        <div class="message" transition:fade>🎵 loading...</div>
    {:else if nowPlaying}
        <a 
            href={nowPlaying.url} 
            target="_blank" 
            class="now-playing" 
            class:playing={nowPlaying.isPlaying}
            transition:fade
        >
            <div class="album-art">
                {#if nowPlaying.albumArt}
                    <img src={nowPlaying.albumArt} alt="" />
                {:else}
                    <div class="placeholder">🎵</div>
                {/if}
            </div>
            
            <div class="info">
                <div class="track">{nowPlaying.trackName}</div>
                <div class="artist">{nowPlaying.artist} — {nowPlaying.album || 'Single'}</div>
            </div>

            <div class="controls">
                <button 
                    class="control-btn" 
                    onclick={(e) => skipTrack(e, 'prev')}
                    title="Previous"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                </button>
                
                <button 
                    class="control-btn main" 
                    onclick={togglePlayPause}
                    title={nowPlaying.isPlaying ? 'Pause' : 'Play'}
                >
                    {#if nowPlaying.isPlaying}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                    {:else}
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    {/if}
                </button>
                
                <button 
                    class="control-btn" 
                    onclick={(e) => skipTrack(e, 'next')}
                    title="Next"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                    </svg>
                </button>
            </div>
        </a>
    {:else}
        <div class="message" transition:fade>🎵 nothing playing</div>
    {/if}
</div>

<style>
    .music-widget {
        width: 100%;
        max-width: 400px;
        font-family: var(--font);
    }

    .message {
        color: var(--txt-3);
        font-size: 0.875rem;
        padding: 1rem;
        text-align: center;
        background: var(--bg-1);
        border: 1px solid var(--bg-3);
        border-radius: 12px;
    }

    .now-playing {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 0.75rem;
        background: var(--bg-1);
        border: 1px solid var(--bg-3);
        border-radius: 12px;
        text-decoration: none;
        color: var(--txt-1);
        cursor: pointer;
    }

    .album-art {
        position: relative;
        width: 64px;
        height: 64px;
        min-width: 64px;
        border-radius: 8px;
        overflow: hidden;
        background: var(--bg-2);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .album-art img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .placeholder {
        font-size: 2rem;
        opacity: 0.3;
    }

    .info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .track {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--txt-1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .artist {
        font-size: 0.75rem;
        color: var(--txt-2);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .controls {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .control-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: var(--bg-2);
        color: var(--txt-2);
        border: none;
        cursor: pointer;
        transition: all 0.2s ease;
        padding: 0;
    }

    .control-btn:hover {
        background: var(--bg-3);
        color: var(--txt-1);
        transform: scale(1.1);
    }

    .control-btn:active {
        transform: scale(0.95);
    }

    .control-btn.main {
        width: 36px;
        height: 36px;
        background: var(--txt-1);
        color: var(--bg-1);
    }

    .control-btn.main:hover {
        background: var(--txt-2);
        transform: scale(1.15);
    }

    .control-btn svg {
        width: 18px;
        height: 18px;
    }

    .control-btn.main svg {
        width: 20px;
        height: 20px;
    }
</style>
