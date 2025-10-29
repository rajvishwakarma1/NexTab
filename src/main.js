import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

const app = mount(App, {
    target: document.getElementById('app'),
})

// Remove focus from address bar on page load
document.addEventListener('DOMContentLoaded', () => {
    document.body.focus()
})

// Also trigger on mount to handle cases where DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    document.body.focus()
}

export default app
