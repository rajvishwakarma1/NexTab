/**
 * GitHub API client for fetching contribution data
 */
class GitHubAPI {
    constructor(username) {
        this.username = username
        this.baseUrl = 'https://api.github.com'
    }

    /**
     * Fetch contribution data using GitHub's GraphQL API
     * This requires a personal access token
     */
    async fetchContributions(token) {
        const query = `
            query {
                user(login: "${this.username}") {
                    contributionsCollection {
                        contributionCalendar {
                            totalContributions
                            weeks {
                                contributionDays {
                                    contributionCount
                                    date
                                }
                            }
                        }
                    }
                }
            }
        `

        try {
            const response = await fetch('https://api.github.com/graphql', {
                method: 'POST',
                headers: {
                    'Authorization': `bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query })
            })

            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`)
            }

            const data = await response.json()
            
            if (data.errors) {
                throw new Error(data.errors[0].message)
            }

            return data.data.user.contributionsCollection.contributionCalendar
        } catch (error) {
            console.error('Failed to fetch GitHub contributions:', error)
            throw error
        }
    }

    /**
     * Get simplified contribution data for the last N months
     */
    async getRecentContributions(token, months = 6) {
        const calendar = await this.fetchContributions(token)
        const today = new Date()
        const monthsAgo = new Date()
        monthsAgo.setMonth(monthsAgo.getMonth() - months)

        // Filter weeks to get recent ones
        const recentWeeks = calendar.weeks.filter(week => {
            const lastDay = week.contributionDays[week.contributionDays.length - 1]
            const weekDate = new Date(lastDay.date)
            return weekDate >= monthsAgo
        })

        // Flatten into all days for stats
        const allDays = recentWeeks.flatMap(week => week.contributionDays)

        return {
            weeks: recentWeeks,
            total: calendar.totalContributions,
            todayCount: this.getTodayCount(allDays)
        }
    }

    /**
     * Get today's commit count
     */
    getTodayCount(days) {
        const today = new Date().toISOString().split('T')[0]
        const todayData = days.find(day => day.date === today)
        return todayData ? todayData.contributionCount : 0
    }
}

export default GitHubAPI
