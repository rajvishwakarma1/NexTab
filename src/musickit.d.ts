/**
 * TypeScript definitions for Apple MusicKit JS and Chrome APIs
 */

interface Window {
    MusicKit: typeof MusicKit
}

declare const chrome: typeof chrome

declare namespace chrome {
    namespace tabs {
        interface Tab {
            id?: number
            url?: string
        }
        function query(queryInfo: { url?: string }): Promise<Tab[]>
    }

    namespace scripting {
        interface ScriptInjection {
            target: { tabId: number }
            func: () => any
        }
        function executeScript(injection: ScriptInjection): Promise<Array<{ result: any }>>
    }
}

declare namespace MusicKit {
    interface MusicKitInstance {
        isAuthorized: boolean
        authorize(): Promise<string>
        nowPlayingItem: MediaItem | null
        playbackState: number
        currentPlaybackTime: number
        pause(): Promise<void>
        play(): Promise<void>
        skipToNextItem(): Promise<void>
        skipToPreviousItem(): Promise<void>
    }

    interface MediaItem {
        id: string
        title?: string
        artistName?: string
        albumName?: string
        playbackDuration?: number
        artwork?: {
            url?: string
        }
        attributes?: {
            name?: string
            artistName?: string
            albumName?: string
            durationInMillis?: number
            artwork?: {
                url?: string
            }
            url?: string
        }
    }

    interface ConfigOptions {
        developerToken: string
        app: {
            name: string
            build: string
        }
    }

    enum PlaybackStates {
        none = 0,
        loading = 1,
        playing = 2,
        paused = 3,
        stopped = 4,
        ended = 5,
        seeking = 6,
        waiting = 8,
        stalled = 9,
        completed = 10
    }

    function configure(options: ConfigOptions): Promise<MusicKitInstance>
    function getInstance(): MusicKitInstance | undefined
}
