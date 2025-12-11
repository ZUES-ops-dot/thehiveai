'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  RefreshCw, 
  Search, 
  Database, 
  Play, 
  Zap, 
  Users, 
  FileText, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Plus,
  Globe,
} from 'lucide-react'

interface CampaignMetric {
  id: string
  name: string
  projectTag: string
  status: string
  startDate: string
  endDate: string
  postCount: number
  participantCount: number
  totalMsp: number
  lastTrackedAt: string | null
  totalPostsTracked: number
}

interface Overview {
  totalCampaigns: number
  activeCampaigns: number
  totalPosts: number
  totalParticipants: number
  totalMsp: number
  recentPosts: number
  weeklyPosts: number
}

interface PostEvent {
  id: string
  campaign_id: string
  user_id: string
  content: string
  likes: number
  retweets: number
  replies: number
  quotes: number
  msp: number
  posted_at: string
  tracked_at: string
  tweet_id: string
}

interface SearchResult {
  posts?: PostEvent[]
  participants?: unknown[]
  campaigns?: unknown[]
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [campaigns, setCampaigns] = useState<CampaignMetric[]>([])
  const [recentPosts, setRecentPosts] = useState<PostEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Tracking state
  const [trackingInProgress, setTrackingInProgress] = useState(false)
  const [trackingResult, setTrackingResult] = useState<Record<string, unknown> | null>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<string>('all')

  // Backfill state
  const [backfillInProgress, setBackfillInProgress] = useState(false)
  const [backfillResult, setBackfillResult] = useState<Record<string, unknown> | null>(null)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [searching, setSearching] = useState(false)

  // UI state
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'backfill' | 'search' | 'addpost' | 'scrape'>('overview')

  // Scrape state
  const [scrapeInProgress, setScrapeInProgress] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<{
    success?: boolean
    error?: string
    summary?: {
      campaignsProcessed: number
      totalTweetsFound: number
      totalTweetsRecorded: number
      totalMspAwarded: number
    }
  } | null>(null)

  // Add post state
  const [addPostUrl, setAddPostUrl] = useState('')
  const [addPostContent, setAddPostContent] = useState('')
  const [addPostUsername, setAddPostUsername] = useState('')
  const [addPostLikes, setAddPostLikes] = useState(0)
  const [addPostRetweets, setAddPostRetweets] = useState(0)
  const [addPostReplies, setAddPostReplies] = useState(0)
  const [addPostQuotes, setAddPostQuotes] = useState(0)
  const [addingPost, setAddingPost] = useState(false)
  const [addPostResult, setAddPostResult] = useState<Record<string, unknown> | null>(null)

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/metrics')
      const data = await res.json()
      if (data.success) {
        setOverview(data.overview)
        setCampaigns(data.campaigns)
        setRecentPosts(data.recentPostEvents)
        setLastUpdated(data.lastUpdated)
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchMetrics()
  }

  const runTracking = async () => {
    setTrackingInProgress(true)
    setTrackingResult(null)
    try {
      const params = new URLSearchParams()
      if (selectedCampaign !== 'all') {
        const campaign = campaigns.find(c => c.id === selectedCampaign)
        if (campaign) params.set('projectTag', campaign.projectTag)
      } else {
        params.set('all', 'true')
      }
      params.set('recalculateRanks', 'true')

      const res = await fetch(`/api/tracking/run?${params}`, { method: 'POST' })
      const data = await res.json()
      setTrackingResult(data)
      fetchMetrics()
    } catch (error) {
      setTrackingResult({ error: 'Tracking failed', details: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setTrackingInProgress(false)
    }
  }

  const runBackfill = async (dryRun: boolean) => {
    setBackfillInProgress(true)
    setBackfillResult(null)
    try {
      const params = new URLSearchParams()
      if (selectedCampaign !== 'all') {
        params.set('campaignId', selectedCampaign)
      }
      if (dryRun) params.set('dryRun', 'true')

      const res = await fetch(`/api/admin/backfill?${params}`, { method: 'POST' })
      const data = await res.json()
      setBackfillResult(data)
      if (!dryRun) fetchMetrics()
    } catch (error) {
      setBackfillResult({ error: 'Backfill failed', details: error instanceof Error ? error.message : 'Unknown' })
    } finally {
      setBackfillInProgress(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) return
    setSearching(true)
    setSearchResults(null)
    try {
      const params = new URLSearchParams({ q: searchQuery, limit: '30' })
      if (selectedCampaign !== 'all') {
        params.set('campaignId', selectedCampaign)
      }
      const res = await fetch(`/api/admin/search?${params}`)
      const data = await res.json()
      if (data.success) {
        setSearchResults(data.results)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  const formatDate = (date: string | null) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString()
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-amber-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading Admin Dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-amber-500/20 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                <Zap className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-amber-400">HiveAI Admin</h1>
                <p className="text-xs text-gray-500">Metrics & Tracking Control</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500">
                Last updated: {formatDate(lastUpdated)}
              </span>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-amber-400 text-sm transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="border-b border-amber-500/10 bg-black/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'tracking', label: 'Run Tracking', icon: Play },
              { id: 'backfill', label: 'Backfill MSP', icon: Database },
              { id: 'search', label: 'Search', icon: Search },
              { id: 'addpost', label: 'Add Post', icon: Plus },
              { id: 'scrape', label: 'Scrape X', icon: Globe },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Campaign Selector */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Select Campaign</label>
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full max-w-md px-4 py-2 bg-gray-900 border border-amber-500/30 rounded-lg text-white focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map(c => (
              <option key={c.id} value={c.id}>
                {c.name} (#{c.projectTag}) - {c.status}
              </option>
            ))}
          </select>
        </div>

        <AnimatePresence mode="wait">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total Campaigns', value: overview?.totalCampaigns ?? 0, icon: FileText, color: 'text-blue-400' },
                  { label: 'Active Campaigns', value: overview?.activeCampaigns ?? 0, icon: Activity, color: 'text-green-400' },
                  { label: 'Total Posts', value: formatNumber(overview?.totalPosts ?? 0), icon: FileText, color: 'text-purple-400' },
                  { label: 'Total Participants', value: formatNumber(overview?.totalParticipants ?? 0), icon: Users, color: 'text-cyan-400' },
                  { label: 'Total MSP', value: formatNumber(overview?.totalMsp ?? 0), icon: TrendingUp, color: 'text-amber-400' },
                  { label: 'Posts (24h)', value: overview?.recentPosts ?? 0, icon: Clock, color: 'text-orange-400' },
                  { label: 'Posts (7d)', value: overview?.weeklyPosts ?? 0, icon: Clock, color: 'text-pink-400' },
                ].map((stat, i) => (
                  <div key={i} className="bg-gray-900/50 border border-gray-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                      <span className="text-xs text-gray-500">{stat.label}</span>
                    </div>
                    <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                  </div>
                ))}
              </div>

              {/* Campaigns Table */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden mb-8">
                <div className="px-4 py-3 border-b border-gray-800">
                  <h2 className="text-lg font-semibold text-amber-400">Campaign Metrics</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Campaign</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Posts</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Participants</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Total MSP</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-400">Last Tracked</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {campaigns.map(campaign => (
                        <tr key={campaign.id} className="hover:bg-gray-800/30">
                          <td className="px-4 py-3">
                            <div className="font-medium text-white">{campaign.name}</div>
                            <div className="text-xs text-gray-500">#{campaign.projectTag}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              campaign.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              campaign.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {campaign.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-white">{formatNumber(campaign.postCount)}</td>
                          <td className="px-4 py-3 text-right text-white">{formatNumber(campaign.participantCount)}</td>
                          <td className="px-4 py-3 text-right text-amber-400 font-medium">{formatNumber(campaign.totalMsp)}</td>
                          <td className="px-4 py-3 text-right text-xs text-gray-400">{formatDate(campaign.lastTrackedAt)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setExpandedCampaign(expandedCampaign === campaign.id ? null : campaign.id)}
                              className="text-gray-400 hover:text-amber-400"
                            >
                              {expandedCampaign === campaign.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-800">
                  <h2 className="text-lg font-semibold text-amber-400">Recent Post Events</h2>
                </div>
                <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
                  {recentPosts.map(post => (
                    <div key={post.id} className="px-4 py-3 hover:bg-gray-800/30">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-300 truncate">{post.content}</p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                            <span>❤️ {post.likes}</span>
                            <span>🔁 {post.retweets}</span>
                            <span>💬 {post.replies}</span>
                            <span>📝 {post.quotes}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-amber-400 font-medium">{post.msp} MSP</div>
                          <div className="text-xs text-gray-500">{formatDate(post.tracked_at)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tracking Tab */}
          {activeTab === 'tracking' && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-amber-400 mb-4">Run Tracking</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Manually trigger tracking to fetch new posts from Nitter and calculate MSP.
                  This will search for posts with #HiveAI and the campaign's project tag.
                </p>
                <button
                  onClick={runTracking}
                  disabled={trackingInProgress}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {trackingInProgress ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Running Tracking...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5" />
                      Run Tracking {selectedCampaign === 'all' ? '(All Campaigns)' : ''}
                    </>
                  )}
                </button>
              </div>

              {trackingResult && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-400 mb-4">Tracking Results</h3>
                  <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">
                    {JSON.stringify(trackingResult, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {/* Backfill Tab */}
          {activeTab === 'backfill' && (
            <motion.div
              key="backfill"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-amber-400 mb-4">Backfill MSP</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Recalculate MSP for all existing posts using the full mindshare engine.
                  This also updates participant totals and recalculates leaderboard ranks.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => runBackfill(true)}
                    disabled={backfillInProgress}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {backfillInProgress ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    Preview (Dry Run)
                  </button>
                  <button
                    onClick={() => runBackfill(false)}
                    disabled={backfillInProgress}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {backfillInProgress ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Running Backfill...
                      </>
                    ) : (
                      <>
                        <Database className="w-5 h-5" />
                        Run Backfill
                      </>
                    )}
                  </button>
                </div>
              </div>

              {backfillResult && (
                <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-amber-400 mb-4">Backfill Results</h3>
                  <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">
                    {JSON.stringify(backfillResult, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {/* Search Tab */}
          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-amber-400 mb-4">Search</h2>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search posts, participants, or campaigns..."
                    className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={searching || searchQuery.length < 2}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {searching ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Search className="w-5 h-5" />
                    )}
                    Search
                  </button>
                </div>
              </div>

              {searchResults && (
                <div className="space-y-6">
                  {/* Posts Results */}
                  {searchResults.posts && searchResults.posts.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <h3 className="font-semibold text-amber-400">Posts ({searchResults.posts.length})</h3>
                      </div>
                      <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
                        {searchResults.posts.map((post: PostEvent) => (
                          <div key={post.id} className="px-4 py-3 hover:bg-gray-800/30">
                            <p className="text-sm text-gray-300">{post.content}</p>
                            <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                              <span className="text-amber-400">{post.msp} MSP</span>
                              <span>❤️ {post.likes}</span>
                              <span>🔁 {post.retweets}</span>
                              <a
                                href={`https://twitter.com/i/status/${post.tweet_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:underline flex items-center gap-1"
                              >
                                View <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Participants Results */}
                  {searchResults.participants && searchResults.participants.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <h3 className="font-semibold text-amber-400">Participants ({searchResults.participants.length})</h3>
                      </div>
                      <div className="divide-y divide-gray-800 max-h-64 overflow-y-auto">
                        {searchResults.participants.map((p: any) => (
                          <div key={p.id} className="px-4 py-3 hover:bg-gray-800/30 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {p.profile_image_url && (
                                <img src={p.profile_image_url} alt="" className="w-8 h-8 rounded-full" />
                              )}
                              <div>
                                <div className="font-medium text-white">{p.display_name}</div>
                                <div className="text-xs text-gray-500">@{p.username}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-amber-400 font-medium">{formatNumber(p.msp)} MSP</div>
                              <div className="text-xs text-gray-500">Rank #{p.rank} • {p.post_count} posts</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Campaigns Results */}
                  {searchResults.campaigns && searchResults.campaigns.length > 0 && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-800">
                        <h3 className="font-semibold text-amber-400">Campaigns ({searchResults.campaigns.length})</h3>
                      </div>
                      <div className="divide-y divide-gray-800">
                        {searchResults.campaigns.map((c: any) => (
                          <div key={c.id} className="px-4 py-3 hover:bg-gray-800/30 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-white">{c.name}</div>
                              <div className="text-xs text-gray-500">#{c.project_tag}</div>
                            </div>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              c.status === 'active' ? 'bg-green-500/20 text-green-400' :
                              c.status === 'upcoming' ? 'bg-blue-500/20 text-blue-400' :
                              'bg-gray-500/20 text-gray-400'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {(!searchResults.posts?.length && !searchResults.participants?.length && !searchResults.campaigns?.length) && (
                    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-8 text-center">
                      <AlertCircle className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Add Post Tab */}
          {activeTab === 'addpost' && (
            <motion.div
              key="addpost"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-amber-400 mb-4">Add Post Manually</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Bypass Nitter scraping by manually adding a post. The post must contain both #HiveAI and the campaign hashtag.
                  The user must already be a participant in the selected campaign.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tweet URL *</label>
                    <input
                      type="text"
                      value={addPostUrl}
                      onChange={(e) => setAddPostUrl(e.target.value)}
                      placeholder="https://x.com/username/status/123456789"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Username *</label>
                    <input
                      type="text"
                      value={addPostUsername}
                      onChange={(e) => setAddPostUsername(e.target.value)}
                      placeholder="@username (must be a campaign participant)"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Tweet Content *</label>
                    <textarea
                      value={addPostContent}
                      onChange={(e) => setAddPostContent(e.target.value)}
                      placeholder="Paste the full tweet text here (must include #HiveAI and campaign hashtag)"
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Likes</label>
                      <input
                        type="number"
                        value={addPostLikes}
                        onChange={(e) => setAddPostLikes(parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Retweets</label>
                      <input
                        type="number"
                        value={addPostRetweets}
                        onChange={(e) => setAddPostRetweets(parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Replies</label>
                      <input
                        type="number"
                        value={addPostReplies}
                        onChange={(e) => setAddPostReplies(parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Quotes</label>
                      <input
                        type="number"
                        value={addPostQuotes}
                        onChange={(e) => setAddPostQuotes(parseInt(e.target.value) || 0)}
                        min={0}
                        className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                  
                  <button
                    onClick={async () => {
                      if (!addPostUrl || !addPostContent || !addPostUsername || selectedCampaign === 'all') {
                        setAddPostResult({ error: 'Please fill all required fields and select a specific campaign' })
                        return
                      }
                      setAddingPost(true)
                      setAddPostResult(null)
                      try {
                        const res = await fetch('/api/admin/add-post', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            tweetUrl: addPostUrl,
                            campaignId: selectedCampaign,
                            content: addPostContent,
                            username: addPostUsername,
                            likes: addPostLikes,
                            retweets: addPostRetweets,
                            replies: addPostReplies,
                            quotes: addPostQuotes,
                          }),
                        })
                        const data = await res.json()
                        setAddPostResult(data)
                        if (data.success) {
                          // Clear form on success
                          setAddPostUrl('')
                          setAddPostContent('')
                          setAddPostUsername('')
                          setAddPostLikes(0)
                          setAddPostRetweets(0)
                          setAddPostReplies(0)
                          setAddPostQuotes(0)
                          fetchMetrics()
                        }
                      } catch (error) {
                        setAddPostResult({ error: 'Failed to add post', details: error instanceof Error ? error.message : 'Unknown' })
                      } finally {
                        setAddingPost(false)
                      }
                    }}
                    disabled={addingPost || selectedCampaign === 'all'}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {addingPost ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding Post...
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Add Post
                      </>
                    )}
                  </button>
                  
                  {selectedCampaign === 'all' && (
                    <p className="text-yellow-400 text-sm">⚠️ Please select a specific campaign above to add a post.</p>
                  )}
                </div>
              </div>

              {addPostResult && (
                <div className={`bg-gray-900/50 border rounded-xl p-6 ${addPostResult.success ? 'border-green-500/50' : 'border-red-500/50'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${addPostResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {addPostResult.success ? '✓ Post Added Successfully' : '✗ Failed to Add Post'}
                  </h3>
                  <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm text-gray-300">
                    {JSON.stringify(addPostResult, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}

          {/* Scrape X Tab */}
          {activeTab === 'scrape' && (
            <motion.div
              key="scrape"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-amber-400 mb-4">Scrape X (Puppeteer)</h2>
                <p className="text-gray-400 text-sm mb-6">
                  Use Puppeteer to scrape posts directly from X. This bypasses Nitter and fetches real-time data including views, likes, retweets, replies, quotes, and bookmarks.
                  Posts must contain both #HiveAI and the campaign hashtag. Users must be campaign participants.
                </p>
                
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
                  <p className="text-yellow-400 text-sm">
                    <strong>⚠️ Note:</strong> Puppeteer scraping runs locally and requires Chrome/Chromium. 
                    It may take several minutes depending on the number of tweets. 
                    X may rate-limit if used too frequently.
                  </p>
                </div>

                {/* Campaign Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Select Campaign to Scrape</label>
                  <select
                    value={selectedCampaign}
                    onChange={(e) => setSelectedCampaign(e.target.value)}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white w-full max-w-md"
                  >
                    <option value="all">All Campaigns</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        #{c.projectTag} - {c.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Will search X for: #HiveAI #{selectedCampaign === 'all' ? '[all campaign tags]' : campaigns.find(c => c.id === selectedCampaign)?.projectTag || ''}
                  </p>
                </div>
                
                <div className="flex gap-4">
                  <button
                    onClick={async () => {
                      setScrapeInProgress(true)
                      setScrapeResult(null)
                      try {
                        const body: Record<string, unknown> = { maxTweets: 30, headless: false }
                        if (selectedCampaign !== 'all') {
                          const campaign = campaigns.find(c => c.id === selectedCampaign)
                          if (campaign) body.projectTag = campaign.projectTag
                        }
                        
                        const res = await fetch('/api/admin/scrape', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(body),
                        })
                        const data = await res.json()
                        setScrapeResult(data)
                        if (data.success) {
                          fetchMetrics()
                        }
                      } catch (error) {
                        setScrapeResult({ 
                          success: false, 
                          error: error instanceof Error ? error.message : 'Unknown error' 
                        })
                      } finally {
                        setScrapeInProgress(false)
                      }
                    }}
                    disabled={scrapeInProgress}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {scrapeInProgress ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Scraping X...
                      </>
                    ) : (
                      <>
                        <Globe className="w-5 h-5" />
                        {selectedCampaign === 'all' ? 'Scrape All Campaigns' : 'Scrape Selected Campaign'}
                      </>
                    )}
                  </button>
                </div>
              </div>

              {scrapeResult && (
                <div className={`bg-gray-900/50 border rounded-xl p-6 ${scrapeResult.success ? 'border-green-500/50' : 'border-red-500/50'}`}>
                  <h3 className={`text-lg font-semibold mb-4 ${scrapeResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {scrapeResult.success ? '✓ Scrape Complete' : '✗ Scrape Failed'}
                  </h3>
                  
                  {scrapeResult.summary && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Campaigns</div>
                        <div className="text-xl font-bold text-white">{scrapeResult.summary.campaignsProcessed}</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Tweets Found</div>
                        <div className="text-xl font-bold text-blue-400">{scrapeResult.summary.totalTweetsFound}</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Tweets Recorded</div>
                        <div className="text-xl font-bold text-green-400">{scrapeResult.summary.totalTweetsRecorded}</div>
                      </div>
                      <div className="bg-black/30 rounded-lg p-3">
                        <div className="text-xs text-gray-500">MSP Awarded</div>
                        <div className="text-xl font-bold text-amber-400">{formatNumber(scrapeResult.summary.totalMspAwarded)}</div>
                      </div>
                    </div>
                  )}
                  
                  <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm text-gray-300 max-h-96">
                    {JSON.stringify(scrapeResult, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
