<script>
    import { onMount, onDestroy } from 'svelte'
    import { settings } from '../settings-store.svelte.js'

    let currentHrs = $state('')
    let currentMin = $state('')
    let currentSec = $state('') 
    let currentAmPm = $state('')
    let currentDate = $state('')
    let clockInterval = null

    // Timer states
    let timerMode = $state(false)
    let timerMinutes = $state(0)
    let timerSeconds = $state(0)
    let timerEndTime = $state(null)
    let timerInterval = null
    let customMinutes = $state(25)
    let showTimerControls = $state(false)
    let timerTotalDuration = $state(0) // Total duration in seconds
    let timerProgress = $state(0) // Progress from 0-100
    let showTimerEndMessage = $state(false) // Show timer end overlay

    const timerPresets = [5, 10, 15, 30, 45]
    
    const TIMER_STORAGE_KEY = 'startpage-timer-state'

    // Save timer state to localStorage
    function saveTimerState() {
        if (timerMode && timerEndTime) {
            const state = {
                endTime: timerEndTime.getTime(),
                totalDuration: timerTotalDuration
            }
            localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state))
        } else {
            localStorage.removeItem(TIMER_STORAGE_KEY)
        }
    }

    // Load timer state from localStorage
    function loadTimerState() {
        const saved = localStorage.getItem(TIMER_STORAGE_KEY)
        if (!saved) return

        try {
            const state = JSON.parse(saved)
            const endTime = new Date(state.endTime)
            const now = new Date()

            // Check if timer is still valid (hasn't ended)
            if (endTime > now) {
                timerMode = true
                timerEndTime = endTime
                timerTotalDuration = state.totalDuration
                updateTimer()
                timerInterval = setInterval(updateTimer, 1000)
            } else {
                // Timer already ended
                localStorage.removeItem(TIMER_STORAGE_KEY)
                showTimerEndMessage = true
            }
        } catch (e) {
            console.error('Failed to load timer state:', e)
            localStorage.removeItem(TIMER_STORAGE_KEY)
        }
    }

    // Listen for storage changes from other tabs
    function handleStorageChange(event) {
        if (event.key === TIMER_STORAGE_KEY) {
            if (event.newValue) {
                // Another tab started/updated a timer
                loadTimerState()
            } else {
                // Another tab stopped the timer
                if (timerInterval) {
                    clearInterval(timerInterval)
                    timerInterval = null
                }
                timerMode = false
                timerEndTime = null
                timerMinutes = 0
                timerSeconds = 0
                timerProgress = 0
                timerTotalDuration = 0
            }
        }
    }

    function updateTime() {
        const now = new Date()

        let hours = now.getHours()

        if (settings.timeFormat === '12hr') {
            currentAmPm = hours >= 12 ? 'pm' : 'am'
            hours = hours % 12
            if (hours === 0) hours = 12
        } else {
            currentAmPm = ''
        }

        currentHrs = hours.toString().padStart(2, '0')
        currentMin = now.getMinutes().toString().padStart(2, '0')
        currentSec = now.getSeconds().toString().padStart(2, '0')

        currentDate = now
            .toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
            .toLowerCase()
    }

    function startClock() {
        updateTime()

        const now = new Date()
        const msUntilNextSecond = 1000 - now.getMilliseconds()

        setTimeout(() => {
            updateTime()
            clockInterval = setInterval(updateTime, 1000)
        }, msUntilNextSecond)
    }

    function startTimer(minutes) {
        timerMode = true
        showTimerControls = false
        timerTotalDuration = minutes * 60 // Store total duration in seconds
        
        const now = new Date()
        timerEndTime = new Date(now.getTime() + minutes * 60 * 1000)
        
        saveTimerState() // Save to localStorage
        updateTimer()
        timerInterval = setInterval(updateTimer, 1000)
    }

    function updateTimer() {
        const now = new Date()
        const remaining = timerEndTime - now

        if (remaining <= 0) {
            stopTimer()
            showTimerEndMessage = true
            return
        }

        timerMinutes = Math.floor(remaining / 60000)
        timerSeconds = Math.floor((remaining % 60000) / 1000)
        
        // Calculate progress (0-100)
        const elapsed = timerTotalDuration - (timerMinutes * 60 + timerSeconds)
        timerProgress = Math.min(100, Math.max(0, Math.floor((elapsed / timerTotalDuration) * 100)))
    }

    function stopTimer() {
        timerMode = false
        timerEndTime = null
        timerMinutes = 0
        timerSeconds = 0
        timerProgress = 0
        timerTotalDuration = 0
        
        saveTimerState() // Clear from localStorage
        
        if (timerInterval) {
            clearInterval(timerInterval)
            timerInterval = null
        }
    }
    
    function closeTimerEndMessage() {
        showTimerEndMessage = false
    }

    function formatEndTime(endTime) {
        if (!endTime) return ''
        
        let hours = endTime.getHours()
        let minutes = endTime.getMinutes()
        
        if (settings.timeFormat === '12hr') {
            const ampm = hours >= 12 ? 'pm' : 'am'
            hours = hours % 12
            if (hours === 0) hours = 12
            return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`
        } else {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        }
    }

    onMount(() => {
        startClock()
        loadTimerState() // Load any existing timer from localStorage
        window.addEventListener('storage', handleStorageChange) // Listen for changes from other tabs
    })

    onDestroy(() => {
        if (clockInterval) {
            clearInterval(clockInterval)
        }
        if (timerInterval) {
            clearInterval(timerInterval)
        }
        window.removeEventListener('storage', handleStorageChange)
    })
</script>

<div class="panel-wrapper" 
     onmouseenter={() => !timerMode && (showTimerControls = true)}
     onmouseleave={() => !timerMode && (showTimerControls = false)}
     role="region"
     aria-label="clock and timer">
    <div class="panel-label">
        {timerMode ? 'timer' : 'datetime'}
    </div>
    <div class="panel">
        {#if timerMode}
            <div class="timer-layout">
                <div class="timer-info">
                    <div class="clock timer-display">
                        {timerMinutes.toString().padStart(2, '0')}<span class="colon">:</span>{timerSeconds.toString().padStart(2, '0')}
                    </div>
                    <div class="date timer-end">
                        ends at {formatEndTime(timerEndTime)}
                    </div>
                    <button class="stop-timer-btn" onclick={stopTimer}>stop timer</button>
                </div>
                
                <!-- Timer Progress Grid (10x10 = 100 cells) -->
                <div class="timer-progress-grid">
                    {#each Array(10) as _, rowIndex}
                        <div class="progress-row">
                            {#each Array(10) as _, colIndex}
                                {@const cellNumber = rowIndex * 10 + colIndex + 1}
                                {@const isFilled = cellNumber <= timerProgress}
                                <div class="progress-cell {isFilled ? 'filled' : ''}"></div>
                            {/each}
                        </div>
                    {/each}
                </div>
            </div>
        {:else if showTimerControls}
            <div class="timer-controls">
                <div class="timer-presets">
                    {#each timerPresets as preset}
                        <button class="timer-preset-btn" onclick={() => startTimer(preset)}>
                            {preset}m
                        </button>
                    {/each}
                </div>
                <div class="timer-custom">
                    <input 
                        type="number" 
                        bind:value={customMinutes} 
                        min="1" 
                        max="999"
                        class="timer-input"
                        placeholder="mins"
                    />
                    <button class="timer-start-btn" onclick={() => startTimer(customMinutes)}>
                        start
                    </button>
                </div>
            </div>
        {:else}
            <div class="clock">
                {currentHrs}<span class="colon">:</span>{currentMin}<span
                    class="colon">:</span
                >{currentSec}
                {#if settings.timeFormat === '12hr'}
                    <span class="ampm">{currentAmPm}</span>
                {/if}
            </div>
            <div class="date">{currentDate}</div>
        {/if}
    </div>
</div>

{#if showTimerEndMessage}
    <div 
        class="timer-end-overlay" 
        onclick={closeTimerEndMessage}
        onkeydown={(e) => e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' ? closeTimerEndMessage() : null}
        role="button"
        tabindex="0"
        aria-label="Timer ended notification - click or press enter to close"
    >
        <div class="timer-end-content">
            <div class="timer-end-title">timer has ended</div>
            <div class="timer-end-note">click anywhere to close this message</div>
        </div>
    </div>
{/if}

<style>
    .panel-wrapper {
        flex-grow: 1;
        position: relative;
    }
    .panel {
        min-height: 150px;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }
    .clock {
        font-size: 3.125rem;
        font-weight: 300;
        color: var(--txt-1);
        line-height: 3.5rem;
        margin: 0 0 0.5rem 0;
        animation: fadeIn 0.3s ease-in;
    }
    .timer-display {
        color: var(--accent);
    }
    .colon,
    .ampm {
        color: var(--txt-2);
    }
    .date {
        font-size: 1.5rem;
        color: var(--txt-3);
        line-height: 2rem;
        margin: 0;
        animation: fadeIn 0.3s ease-in;
    }
    .timer-end {
        font-size: 1rem;
        color: var(--txt-2);
        margin-bottom: 0.5rem;
    }
    .stop-timer-btn {
        font-size: 0.875rem;
        padding: 0.25rem 0.75rem;
        background: var(--bg-2);
        border: 1px solid var(--bg-3);
        color: var(--txt-2);
        cursor: pointer;
        border-radius: 4px;
        margin-top: 0.5rem;
        align-self: flex-start;
        transition: all 0.2s ease;
    }
    .stop-timer-btn:hover {
        background: var(--bg-3);
        color: var(--txt-1);
    }
    
    .timer-layout {
        display: flex;
        align-items: center;
        gap: 2rem;
        justify-content: center;
    }
    
    .timer-info {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
    }
    
    .timer-progress-grid {
        display: flex;
        flex-direction: column;
        gap: 2px;
        animation: fadeIn 0.3s ease-in;
    }
    
    .progress-row {
        display: flex;
        gap: 2px;
    }
    
    .progress-cell {
        width: 8px;
        height: 8px;
        border-radius: 1px;
        background-color: var(--bg-3);
        transition: none;
    }
    
    .progress-cell.filled {
        background-color: var(--txt-1);
        animation: cellFill 0.2s ease-out forwards;
    }
    
    .timer-controls {
        animation: fadeInScale 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        transform-origin: top center;
    }
    .timer-presets {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
        margin-bottom: 1rem;
        justify-content: center;
    }
    .timer-preset-btn {
        padding: 0.5rem 1rem;
        background: var(--bg-2);
        border: 1px solid var(--bg-3);
        color: var(--txt-2);
        cursor: pointer;
        border-radius: 4px;
        font-size: 1rem;
        transition: all 0.2s ease;
    }
    .timer-preset-btn:hover {
        background: var(--bg-3);
        color: var(--txt-1);
        transform: translateY(-2px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }
    .timer-custom {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }
    .timer-input {
        width: 80px;
        padding: 0.5rem;
        background: var(--bg-2);
        border: 1px solid var(--bg-3);
        color: var(--txt-1);
        font-family: inherit;
        font-size: 1rem;
        border-radius: 4px;
        text-align: center;
    }
    .timer-input:focus {
        outline: none;
        border-color: var(--txt-3);
    }
    .timer-start-btn {
        padding: 0.5rem 1.5rem;
        background: var(--txt-1);
        border: 1px solid var(--txt-1);
        color: var(--bg-1);
        cursor: pointer;
        border-radius: 4px;
        font-size: 1rem;
        font-weight: 500;
        transition: all 0.2s ease;
    }
    .timer-start-btn:hover {
        background: var(--txt-2);
        border-color: var(--txt-2);
        transform: translateY(-2px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    @keyframes fadeInScale {
        0% {
            opacity: 0;
            transform: scale(0.95) translateY(-10px);
        }
        100% {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
    
    @keyframes cellFill {
        0% {
            transform: scale(0.8);
            opacity: 0.5;
        }
        50% {
            transform: scale(1.1);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .timer-end-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        cursor: pointer;
        animation: overlayFadeIn 0.3s ease-out;
        outline: none;
    }
    
    .timer-end-overlay:focus {
        outline: 2px solid var(--txt-3);
        outline-offset: -10px;
    }
    
    .timer-end-content {
        text-align: center;
        animation: messageSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    }
    
    .timer-end-title {
        font-size: 4rem;
        font-weight: 300;
        color: var(--txt-1);
        margin-bottom: 1rem;
        letter-spacing: 0.05em;
    }
    
    .timer-end-note {
        font-size: 1rem;
        color: var(--txt-3);
        opacity: 0.7;
    }
    
    @keyframes overlayFadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }
    
    @keyframes messageSlideIn {
        0% {
            opacity: 0;
            transform: translateY(-30px) scale(0.9);
        }
        100% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }
</style>
