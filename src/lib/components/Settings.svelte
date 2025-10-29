<script>
    import { fade, fly } from 'svelte/transition'
    import { saveSettings, settings } from '../settings-store.svelte.js'
    import { getTheme, setTheme } from '../theme-store.svelte.js'
    import { themeNames, themes } from '../themes.js'
    import RadioButton from './RadioButton.svelte'

    let { showSettings = false, closeSettings } = $props()

    // @ts-ignore
    const version = __APP_VERSION__

    // Reactive theme binding
    let currentTheme = $state(getTheme())
    $effect(() => {
        setTheme(currentTheme)
    })

    function addLink() {
        settings.links = [...settings.links, { title: '', url: '' }]
    }

    function removeLink(index) {
        settings.links = settings.links.filter((_, i) => i !== index)
    }

    function handleClose() {
        saveSettings(settings)
        closeSettings()
    }

    function handleKeydown(event) {
        if (event.key === 'Escape') {
            handleClose()
        }
    }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if showSettings}
    <div
        class="backdrop"
        onclick={handleClose}
        onkeydown={(e) => e.key === 'Enter' && handleClose()}
        role="button"
        tabindex="0"
        transition:fade={{ duration: 200 }}
    ></div>

    <div class="settings" transition:fly={{ x: 640, duration: 200 }}>
        <div class="header">
            <h2>settings</h2>
            <button class="close-btn" onclick={handleClose}>×</button>
        </div>

        <div class="content">
            <!-- APPEARANCE -->
            <div class="category-header">appearance</div>
            
            <div class="group">
                <div class="setting-label">theme</div>
                <div class="theme-grid">
                    {#each themeNames as themeName}
                        <div class="theme-option">
                            <RadioButton
                                bind:group={currentTheme}
                                value={themeName}
                            >
                                <div class="theme-preview">
                                    <div
                                        style="background-color: {themes[
                                            themeName
                                        ].colors['--bg-1']}"
                                    ></div>
                                    <div
                                        style="background-color: {themes[
                                            themeName
                                        ].colors['--txt-4']}"
                                    ></div>
                                    <div
                                        style="background-color: {themes[
                                            themeName
                                        ].colors['--txt-2']}"
                                    ></div>
                                </div>
                                <span class="theme-name"
                                    >{themes[themeName].displayName}</span
                                >
                            </RadioButton>
                        </div>
                    {/each}
                </div>
            </div>

            <!-- BANNER & GREETING -->
            <div class="category-header">banner & greeting</div>
            
            <div class="group">
                <div class="radio-group">
                    <label>
                        <input type="checkbox" bind:checked={settings.showBanner} />
                        show banner
                    </label>
                </div>
                {#if settings.showBanner}
                    <label for="banner-select" style="margin-top: 1rem; display: block;">select banner</label>
                    <select id="banner-select" bind:value={settings.banner} class="banner-select">
                        <option value="bg-1.gif">bg-1</option>
                        <option value="bg-2.gif">bg-2</option>
                        <option value="bg-3.gif">bg-3</option>
                        <option value="cbg-1.gif">cbg-1</option>
                        <option value="cbg-2.gif">cbg-2</option>
                        <option value="cbg-3.gif">cbg-3</option>
                        <option value="cbg-4.gif">cbg-4</option>
                        <option value="cbg-5.gif">cbg-5</option>
                        <option value="cbg-6.gif">cbg-6</option>
                        <option value="cbg-7.gif">cbg-7</option>
                        <option value="cbg-8.gif">cbg-8</option>
                        <option value="cbg-9.gif">cbg-9</option>
                        <option value="cbg-10.gif">cbg-10</option>
                        <option value="cbg-11.gif">cbg-11</option>
                        <option value="cbg-12.gif">cbg-12</option>
                        <option value="cbg-13.gif">cbg-13</option>
                    </select>
                    <label for="banner-text" style="margin-top: 1rem; display: block;">banner text (optional)</label>
                    <input
                        id="banner-text"
                        type="text"
                        bind:value={settings.bannerText}
                        placeholder="e.g., DAILY, MEDIA, NEWS..."
                    />
                    {#if settings.bannerText}
                        <div class="radio-group" style="margin-top: 0.5rem;">
                            <label>
                                <input type="checkbox" bind:checked={settings.bannerTextBlur} />
                                blur background
                            </label>
                        </div>
                    {/if}
                    <div class="radio-group" style="margin-top: 1rem;">
                        <label>
                            <input type="checkbox" bind:checked={settings.showGreeting} />
                            show greeting
                        </label>
                    </div>
                    {#if settings.showGreeting}
                        <label for="greeting-name" style="margin-top: 0.5rem; display: block;">your name</label>
                        <input
                            id="greeting-name"
                            type="text"
                            bind:value={settings.greetingName}
                            placeholder="Enter your name"
                        />
                    {/if}
                {/if}
            </div>

            <!-- TIME & DATE -->
            <div class="category-header">time & date</div>
            
            <div class="group">
                <div class="setting-label">time format</div>
                <div class="radio-group">
                    <RadioButton bind:group={settings.timeFormat} value="12hr">
                        12 hour
                    </RadioButton>
                    <RadioButton bind:group={settings.timeFormat} value="24hr">
                        24 hour
                    </RadioButton>
                </div>
            </div>

            <!-- WIDGETS -->
            <div class="category-header">widgets</div>
            
            <div class="group">
                <label for="todoist-token">todoist api token</label>
                <input
                    id="todoist-token"
                    type="password"
                    bind:value={settings.todoistApiToken}
                />
            </div>
            
            <div class="group">
                <label for="github-username">github username</label>
                <input
                    id="github-username"
                    type="text"
                    bind:value={settings.githubUsername}
                    placeholder="e.g., rajvishwakarma1"
                />
            </div>
            <div class="group">
                <label for="github-token">github personal access token</label>
                <input
                    id="github-token"
                    type="password"
                    bind:value={settings.githubToken}
                    placeholder="ghp_..."
                />
                <small style="color: var(--txt-3); font-size: 0.75rem; margin-top: 0.25rem; display: block;">
                    Create a token at: Settings → Developer settings → Personal access tokens → Generate new token (classic). No scopes needed for public data.
                </small>
                {#if settings.githubUsername && settings.githubToken}
                    <div class="radio-group" style="margin-top: 0.5rem;">
                        <label>
                            <input type="checkbox" bind:checked={settings.showGithub} />
                            show github widget
                        </label>
                    </div>
                {/if}
            </div>

            <!-- MUSIC -->
            <div class="category-header">music</div>
            
            <div class="group">
                <div class="setting-label">music service</div>
                <select bind:value={settings.musicService} class="banner-select">
                    <option value="spotify">Spotify</option>
                    <option value="youtubemusic">YouTube Music</option>
                </select>
            </div>
            <div class="group">
                <label for="music-token">music api token</label>
                <input
                    id="music-token"
                    type="password"
                    bind:value={settings.musicToken}
                    placeholder={settings.musicService === 'youtubemusic' ? 'Enter: extension' : 'Spotify access token'}
                />
                <small style="color: var(--txt-3); font-size: 0.75rem; margin-top: 0.25rem; display: block;">
                    {#if settings.musicService === 'spotify'}
                        Get token from <a href="https://developer.spotify.com/console/get-users-currently-playing-track/" target="_blank" style="color: var(--txt-2);">Spotify Console</a> (click "Get Token", select "user-read-currently-playing" and "user-read-playback-state").
                    {:else if settings.musicService === 'youtubemusic'}
                        Just type "extension" in the field above. Make sure you have YouTube Music open in another tab and music is playing. The extension will automatically detect it.
                    {:else}
                        Select a music service above.
                    {/if}
                </small>
                {#if settings.musicService && settings.musicToken}
                    <div class="radio-group" style="margin-top: 0.5rem;">
                        <label>
                            <input type="checkbox" bind:checked={settings.showMusic} />
                            show now playing widget
                        </label>
                    </div>
                {/if}
            </div>

            <!-- WEATHER -->
            <div class="category-header">weather</div>
            
            <div class="group">
                <label for="latitude">latitude</label>
                <input
                    id="latitude"
                    type="number"
                    bind:value={settings.latitude}
                    step="0.01"
                />
            </div>
            <div class="group">
                <label for="longitude">longitude</label>
                <input
                    id="longitude"
                    type="number"
                    bind:value={settings.longitude}
                    step="0.01"
                />
            </div>
            <div class="group">
                <div class="setting-label">temperature format</div>
                <div class="radio-group">
                    <RadioButton
                        bind:group={settings.tempUnit}
                        value="fahrenheit"
                    >
                        fahrenheit
                    </RadioButton>
                    <RadioButton bind:group={settings.tempUnit} value="celsius">
                        celsius
                    </RadioButton>
                </div>
            </div>
            <div class="group">
                <div class="setting-label">speed format</div>
                <div class="radio-group">
                    <RadioButton bind:group={settings.speedUnit} value="mph">
                        mph
                    </RadioButton>
                    <RadioButton bind:group={settings.speedUnit} value="kmh">
                        kmh
                    </RadioButton>
                </div>
            </div>

            <!-- LINKS -->
            <div class="category-header">links</div>
            
            <div class="group">
                <label for="linksPerColumn">links per column</label>
                <input
                    id="linksPerColumn"
                    type="number"
                    bind:value={settings.linksPerColumn}
                    step="1"
                />
            </div>
            <div class="group">
                <div class="setting-label">link behavior</div>
                <div class="radio-group">
                    <RadioButton bind:group={settings.linkTarget} value="_self">
                        same tab
                    </RadioButton>
                    <RadioButton
                        bind:group={settings.linkTarget}
                        value="_blank"
                    >
                        new tab
                    </RadioButton>
                </div>
            </div>
            <div class="group">
                <div class="links-header">
                    <div class="setting-label">custom links</div>
                    <button class="add-btn" onclick={addLink}>add link</button>
                </div>
                <div class="links-list">
                    {#each settings.links as link, index}
                        <div class="link">
                            <input
                                type="text"
                                bind:value={link.title}
                                placeholder="title"
                                class="link-input name"
                            />
                            <input
                                type="url"
                                bind:value={link.url}
                                placeholder="https://example.com"
                                class="link-input"
                            />
                            <button
                                class="remove-btn"
                                onclick={() => removeLink(index)}
                            >
                                ×
                            </button>
                        </div>
                    {/each}
                </div>
            </div>
            
            <div class="version">
                startpage
                {#if version}v{version}
                {/if} • made with ❤️ by
                <a href="http://rajvishwakarma.tech/" target="_blank">Raj Vishwakarma</a>
                •
                <a href="https://github.com/rajvishwakarma1" target="_blank"
                    >github</a
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .backdrop {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 999;
    }
    .settings {
        position: fixed;
        top: 0;
        right: 0;
        width: 40rem;
        height: 100%;
        background: var(--bg-1);
        border-left: 2px solid var(--bg-3);
        z-index: 1000;
        display: flex;
        flex-direction: column;
    }
    .header {
        padding: 0.75rem 1rem 0.75rem 1.5rem;
        border-bottom: 2px solid var(--bg-3);
        display: flex;
        justify-content: space-between;
        align-items: center;

        h2 {
            margin: 0;
        }
    }
    .close-btn {
        padding: 0 0.5rem;
        font-size: 1.75rem;
        line-height: 2.25rem;
        font-weight: 300;
    }
    .content {
        flex: 1;
        padding: 1.5rem;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: var(--bg-3) var(--bg-1);
    }
    .group {
        margin-bottom: 1.5rem;
    }
    .category-header {
        font-size: 1.125rem;
        font-weight: 600;
        color: var(--txt-1);
        margin: 2rem 0 1rem 0;
        padding-bottom: 0.5rem;
        border-bottom: 2px solid var(--bg-3);
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .category-header:first-child {
        margin-top: 0;
    }
    .group > label,
    .setting-label {
        display: block;
        margin-bottom: 0.5rem;
    }
    .group input[type='text'],
    .group input[type='password'],
    .group input[type='number'],
    .group input[type='url'] {
        width: 100%;
        padding: 0.5rem;
        background: var(--bg-2);
        border: 2px solid var(--bg-3);
    }
    .banner-select {
        width: 100%;
        padding: 0.5rem;
        background: var(--bg-2);
        border: 2px solid var(--bg-3);
        color: var(--txt-1);
        font-family: inherit;
        font-size: inherit;
        margin-top: 0.5rem;
    }
    .banner-select:focus {
        outline: none;
        border-color: var(--txt-3);
    }
    .links-header {
        display: flex;
        justify-content: space-between;
    }
    .add-btn {
        height: 1.5rem;
    }
    .link {
        display: flex;
        margin-bottom: 0.5rem;
    }
    .link-input.name {
        width: 12rem;
        margin-right: 0.5rem;
    }
    .remove-btn {
        padding-left: 0.5rem;
        font-size: 1.5rem;
        font-weight: 300;
    }
    .version {
        color: var(--txt-3);
    }
    .theme-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.5rem;
    }
    .theme-preview {
        display: inline-flex;
        vertical-align: middle;
        margin-top: -0.125rem;
        border: 2px solid var(--bg-3);
    }
    .theme-preview div {
        width: 1rem;
        height: 1rem;
    }
    .theme-name {
        font-size: 0.9rem;
        flex: 1;
    }
    .radio-group {
        display: flex;
        gap: 3ch;
    }
</style>
