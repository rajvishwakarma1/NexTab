<script>
    import '@fontsource-variable/geist-mono'
    import Clock from './lib/components/Clock.svelte'
    import Links from './lib/components/Links.svelte'
    import Settings from './lib/components/Settings.svelte'
    import Stats from './lib/components/Stats.svelte'
    import Todoist from './lib/components/Todoist.svelte'
    import Weather from './lib/components/Weather.svelte'
    import GitHub from './lib/components/GitHub.svelte'
    import NowPlaying from './lib/components/NowPlaying.svelte'
    import { settings } from './lib/settings-store.svelte.js'

    let showSettings = $state(false)

    function closeSettings() {
        showSettings = false
    }

    // Import all banner images
    const banners = import.meta.glob('./assets/banners/*.gif', { eager: true, query: '?url', import: 'default' })
    
    let bannerUrl = $derived(settings.banner && banners[`./assets/banners/${settings.banner}`])
    
    let showGithubWidget = $derived(settings.showGithub && settings.githubUsername && settings.githubToken)
    let showMusicWidget = $derived(settings.showMusic && settings.musicService && settings.musicToken)

    function getGreeting() {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good morning'
        if (hour < 18) return 'Good afternoon'
        return 'Good evening'
    }

    let greeting = $state(getGreeting())
    
    // Update greeting every minute
    $effect(() => {
        const interval = setInterval(() => {
            greeting = getGreeting()
        }, 60000)
        
        return () => clearInterval(interval)
    })
</script>

<main>
    <div class="page-wrapper">
        {#if settings.showBanner && bannerUrl}
            <div class="banner-section">
                {#if settings.showGreeting}
                    <div class="greeting">
                        {greeting}, {settings.greetingName}
                    </div>
                {/if}
                <div class="banner-container" class:banner-only={!showGithubWidget && !showMusicWidget}>
                    <img src={bannerUrl} alt="Banner" class="banner" />
                    {#if settings.bannerText}
                        <div class="banner-text-overlay" class:blurred={settings.bannerTextBlur}>
                            <div class="banner-text">
                                {settings.bannerText}
                            </div>
                        </div>
                    {/if}
                </div>
                {#if showGithubWidget}
                    <GitHub />
                {/if}
                {#if showMusicWidget}
                    <NowPlaying />
                {/if}
            </div>
        {/if}
        <div class="container">
            <div class="top">
                <Clock />
                <Stats />
            </div>
            <div class="widgets">
                <Weather />
                <Todoist />
            </div>
            <Links />
        </div>
    </div>

    <button
        class="settings-btn"
        onclick={() => (showSettings = true)}
        aria-label="Open settings"
    >
        settings
    </button>

    <Settings {showSettings} {closeSettings} />
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
        max-height: 100vh;
        justify-content: center;
        align-items: center;
        padding: 1rem;
        overflow: hidden;
    }
    .page-wrapper {
        display: flex;
        gap: 2rem;
        align-items: center;
        max-height: 90vh;
    }
    .banner-section {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: center;
        max-height: 100%;
    }
    .greeting {
        font-size: 3.125rem;
        color: var(--txt-2);
        font-weight: 300;
        text-align: center;
        font-family: 'Brush Script MT', cursive, serif;
        font-style: italic;
    }
    .banner-container {
        display: flex;
        align-items: center;
        position: relative;
    }
    .banner {
        max-height: 400px;
        max-width: 350px;
        border-radius: 8px;
        object-fit: contain;
    }
    
    .banner-container.banner-only .banner {
        max-height: 500px;
        max-width: 400px;
    }
    .banner-text-overlay {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40%;
        height: 80%;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 8px;
        pointer-events: none;
    }
    .banner-text-overlay.blurred {
        backdrop-filter: blur(8px);
        background: rgba(255, 255, 255, 0.1);
    }
    .banner-text {
        color: white;
        font-size: 2rem;
        font-weight: 300;
        text-transform: uppercase;
        letter-spacing: 0.5rem;
        writing-mode: vertical-rl;
        text-orientation: upright;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
    }
    .container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .top,
    .widgets {
        display: flex;
        gap: 1.5rem;
    }
    .settings-btn {
        position: fixed;
        top: 0;
        right: 0;
        padding: 1rem 1.5rem;
        opacity: 0;
        transition: opacity 0.2s ease;
        z-index: 100;
        color: var(--txt-3);
    }
    .settings-btn:hover {
        opacity: 1;
    }
</style>
