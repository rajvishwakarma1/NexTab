<script>
    import { onMount, onDestroy, untrack } from 'svelte'
    import TodoistAPI from '../todoist-api.js'
    import { settings } from '../settings-store.svelte.js'

    let api = null
    let tasks = $state([])
    let syncing = $state(true)
    let error = $state('')
    let initialLoad = $state(true)
    let taskCount = $derived(tasks.filter((task) => !task.checked).length)
    let newTaskContent = $state('')
    let addingTask = $state(false)
    let taskInputRef = null

    function handleKeyPress(event) {
        if (event.key === 't' && !event.ctrlKey && !event.metaKey && !event.altKey) {
            // Don't trigger if user is already typing in an input/textarea
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                return
            }
            event.preventDefault()
            taskInputRef?.focus()
        }
    }

    function handleVisibilityChange() {
        if (document.visibilityState === 'visible' && api) {
            loadTasks()
        }
    }

    $effect(() => {
        const token = settings.todoistApiToken

        if (untrack(() => initialLoad)) {
            initialLoad = false
            return
        }

        initializeAPI(token, true)
    })

    async function initializeAPI(token, clearLocalData = false) {
        if (!token) {
            api = null
            tasks = []
            syncing = false
            error = 'no todoist api token'
            return
        }
        api = new TodoistAPI(token)
        if (clearLocalData) {
            api.clearLocalData()
            tasks = []
        }
        await loadTasks(true)
    }

    export async function loadTasks(showSyncing = false) {
        try {
            if (showSyncing) syncing = true
            error = ''
            await api.sync()
            tasks = api.getTasks()
        } catch (err) {
            error = `failed to sync tasks`
            console.error(err)
        } finally {
            if (showSyncing) syncing = false
        }
    }

    async function toggleTask(taskId, checked) {
        try {
            tasks = tasks.map((task) =>
                task.id === taskId
                    ? {
                          ...task,
                          checked: checked,
                          completed_at: checked
                              ? new Date().toISOString()
                              : null,
                      }
                    : task
            )

            if (checked) {
                await api.completeTask(taskId)
            } else {
                await api.uncompleteTask(taskId)
            }
            await loadTasks()
        } catch (err) {
            console.error(err)
            await loadTasks()
        }
    }

    async function addTask(event) {
        event.preventDefault()
        if (!newTaskContent.trim() || addingTask) return

        try {
            addingTask = true
            error = ''
            const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
            await api.addTask(newTaskContent.trim(), null, today)
            newTaskContent = ''
            await loadTasks()
        } catch (err) {
            error = 'failed to add task'
            console.error(err)
        } finally {
            addingTask = false
        }
    }

    function isTaskOverdue(task) {
        if (!task.due || task.checked) return false
        const now = new Date()
        return task.due_date.getTime() < now.getTime()
    }

    function formatDueDate(date, hasTime) {
        if (!date) return ''

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const dueDate = new Date(date)
        const dueDateOnly = new Date(
            dueDate.getFullYear(),
            dueDate.getMonth(),
            dueDate.getDate()
        )

        const diffTime = dueDateOnly.getTime() - today.getTime()
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        let dateString = ''

        if (diffDays === -1) {
            dateString = 'yesterday'
        } else if (diffDays === 0) {
            dateString = 'today'
        } else if (diffDays === 1) {
            dateString = 'tmrw'
        } else if (diffDays > 1 && diffDays < 7) {
            dateString = dueDate
                .toLocaleDateString('en-US', {
                    weekday: 'short',
                })
                .toLowerCase()
        } else {
            dateString = dueDate
                .toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                })
                .toLowerCase()
        }

        if (hasTime) {
            let timeString
            if (settings.timeFormat === '12hr') {
                timeString = dueDate
                    .toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })
                    .toLowerCase()
            } else {
                timeString = dueDate.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: false,
                })
            }
            dateString += ` ${timeString}`
        }

        return dateString
    }

    onMount(() => {
        initializeAPI(settings.todoistApiToken)
        if (api) {
            tasks = api.getTasks()
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)
        document.addEventListener('keydown', handleKeyPress)
    })

    onDestroy(() => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        document.removeEventListener('keydown', handleKeyPress)
    })
</script>

<div class="panel-wrapper">
    <button
        class="widget-label"
        onclick={() => loadTasks(true)}
        disabled={syncing}
    >
        {syncing ? 'syncing...' : 'todoist'}
    </button>
    <div class="panel">
        {#if error}
            <div class="error">{error}</div>
        {:else}
            <div class="widget-header">
                <a
                    href="https://todoist.com/app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    {taskCount} task{taskCount === 1 ? '' : 's'}
                </a>
            </div>

            <br />
            
            <form class="add-task-form" onsubmit={addTask}>
                <input
                    type="text"
                    bind:value={newTaskContent}
                    bind:this={taskInputRef}
                    placeholder="add new task..."
                    disabled={addingTask}
                    class="task-input"
                />
                <button 
                    type="submit" 
                    disabled={addingTask || !newTaskContent.trim()}
                    class="add-button"
                >
                    {addingTask ? '+' : '+'}
                </button>
            </form>

            <br />
            <div class="tasks">
                <div class="tasks-list">
                    {#each tasks as task}
                        <div
                            class="task"
                            class:completed={task.checked}
                            class:overdue={isTaskOverdue(task)}
                        >
                            <button
                                onclick={() =>
                                    toggleTask(task.id, !task.checked)}
                                class="checkbox"
                                class:completed={task.checked}
                            >
                                {task.checked ? '[x]' : '[ ]'}
                            </button>
                            {#if task.project_name && task.project_name !== 'Inbox'}
                                <span class="task-project"
                                    >#{task.project_name}</span
                                >
                            {/if}
                            <span class="task-title">{task.content}</span>
                            {#if task.due}
                                <span
                                    class="task-due"
                                    class:overdue-date={isTaskOverdue(task)}
                                >
                                    {formatDueDate(
                                        task.due_date,
                                        task.has_time
                                    )}
                                </span>
                            {/if}
                        </div>
                    {/each}
                </div>
            </div>
        {/if}
    </div>
</div>

<style>
    .panel-wrapper {
        flex: 1;
    }
    .widget-header {
        display: flex;
        justify-content: space-between;
    }
    .add-task-form {
        display: flex;
        gap: 0.5rem;
    }
    .task-input {
        flex: 1;
        background: transparent;
        border: 1px solid var(--txt-3);
        color: var(--txt-1);
        padding: 0.25rem 0.5rem;
        font-family: inherit;
        font-size: inherit;
    }
    .task-input:focus {
        outline: none;
        border-color: var(--txt-1);
    }
    .task-input::placeholder {
        color: var(--txt-3);
    }
    .add-button {
        background: transparent;
        border: 1px solid var(--txt-3);
        color: var(--txt-1);
        padding: 0.25rem 0.75rem;
        cursor: pointer;
        font-family: inherit;
        font-size: inherit;
    }
    .add-button:hover:not(:disabled) {
        border-color: var(--txt-1);
    }
    .add-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    .tasks {
        max-height: 15rem;
        overflow: auto;
        scrollbar-width: none;
    }
    .task {
        max-width: 40rem;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
    .task-due {
        color: var(--txt-3);
    }
    .task-project {
        color: var(--txt-3);
    }
    .task.completed .task-title {
        text-decoration: line-through;
    }
    .overdue-date {
        color: var(--txt-err);
    }
</style>
