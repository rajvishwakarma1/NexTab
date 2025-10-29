<script>
    import { onMount } from 'svelte'
    import GitHubAPI from '../github-api.js'
    import { settings } from '../settings-store.svelte.js'

    let weeks = $state([])
    let todayCount = $state(0)
    let totalContributions = $state(0)
    let loading = $state(true)
    let error = $state('')

    async function loadContributions() {
        if (!settings.githubUsername || !settings.githubToken) {
            error = 'no github credentials'
            loading = false
            return
        }

        try {
            loading = true
            error = ''
            const api = new GitHubAPI(settings.githubUsername)
            const data = await api.getRecentContributions(settings.githubToken, 6)
            
            weeks = data.weeks
            todayCount = data.todayCount
            totalContributions = data.total
        } catch (err) {
            error = 'failed to load contributions'
            console.error(err)
        } finally {
            loading = false
        }
    }

    function getContributionLevel(count) {
        if (count === 0) return 0
        if (count <= 3) return 1
        if (count <= 6) return 2
        if (count <= 9) return 3
        return 4
    }

    onMount(() => {
        loadContributions()
    })

    export { loadContributions }
</script>

<div class="github-widget">
    {#if error}
        <div class="error">{error}</div>
    {:else if !loading}
        <div class="contribution-graph">
            {#each weeks as week}
                <div class="week">
                    {#each week.contributionDays as day}
                        <div
                            class="day level-{getContributionLevel(day.contributionCount)}"
                            title="{day.contributionCount} contributions on {day.date}"
                        ></div>
                    {/each}
                </div>
            {/each}
        </div>
        
        <div class="stats">
            <div class="stat">
                <span class="stat-value">{todayCount}</span>
                <span class="stat-label">today</span>
            </div>
            <div class="stat">
                <span class="stat-value">{totalContributions}</span>
                <span class="stat-label">this year</span>
            </div>
        </div>
    {/if}
</div>

<style>
    .github-widget {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        max-width: 350px;
        width: 100%;
    }
    
    .widget-label {
        color: var(--txt-3);
        align-self: flex-start;
        font-size: 0.875rem;
    }
    
    .error {
        color: var(--txt-err);
        font-size: 0.75rem;
    }
    
    .contribution-graph {
        display: flex;
        gap: 2px;
        padding: 0.25rem 0;
        max-width: 100%;
        overflow-x: auto;
        scrollbar-width: none;
    }
    
    .contribution-graph::-webkit-scrollbar {
        display: none;
    }
    
    .week {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    
    .day {
        width: 8px;
        height: 8px;
        border-radius: 1px;
        background-color: var(--bg-3);
    }
    
    .day.level-1 {
        background-color: var(--txt-4);
        opacity: 0.4;
    }
    
    .day.level-2 {
        background-color: var(--txt-3);
        opacity: 0.6;
    }
    
    .day.level-3 {
        background-color: var(--txt-2);
        opacity: 0.8;
    }
    
    .day.level-4 {
        background-color: var(--txt-1);
    }
    
    .stats {
        display: flex;
        gap: 1.25rem;
    }
    
    .stat {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
    }
    
    .stat-value {
        font-size: 1.25rem;
        color: var(--txt-1);
        line-height: 1;
    }
    
    .stat-label {
        font-size: 0.75rem;
        color: var(--txt-3);
    }
</style>
