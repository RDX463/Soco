import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { toast } from 'react-toastify'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ users: [], posts: [] })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')

  // Memoize performSearch to fix eslint warning
  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults({ users: [], posts: [] })
      return
    }
    
    setLoading(true)
    try {
      console.log('Searching for:', query) // Debug log
      const res = await api.get(`/search?q=${encodeURIComponent(query)}`)
      console.log('Search results:', res.data) // Debug log
      setResults(res.data)
    } catch (err) {
      console.error('Search error:', err)
      toast.error('Search failed')
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    if (query.trim()) {
      const timer = setTimeout(() => {
        performSearch()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setResults({ users: [], posts: [] })
    }
  }, [query, performSearch])

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Search</h1>
      
      {/* Search Input */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for posts, users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
          />
          <svg 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          
          {loading && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {query.trim() && (
        <>
          {/* Tabs */}
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 rounded-md transition duration-200 ${
                activeTab === 'posts' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Posts ({results.posts.length})
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-md transition duration-200 ${
                activeTab === 'users' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Users ({results.users.length})
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Searching...</p>
            </div>
          ) : (
            <>
              {activeTab === 'posts' && (
                <div className="space-y-4">
                  {results.posts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      No posts found for "{query}"
                    </div>
                  ) : (
                    results.posts.map(post => (
                      <div key={post._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-xl font-bold">{post.title}</h3>
                          <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            {post.category}
                          </span>
                        </div>
                        <p className="text-gray-600 mb-4">{post.content.substring(0, 200)}...</p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            {post.author.profilePicture ? (
                              <img 
                                src={`http://localhost:5000${post.author.profilePicture}`} 
                                alt="Profile" 
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {post.author.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )}
                            <span>By {post.author.name} • {new Date(post.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex space-x-4">
                            <span>{post.likeCount || 0} likes</span>
                            <span>{post.views || 0} views</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'users' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {results.users.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      No users found for "{query}"
                    </div>
                  ) : (
                    results.users.map(user => (
                      <div key={user._id} className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
                        <div className="flex items-center space-x-3 mb-4">
                          {user.profilePicture ? (
                            <img 
                              src={`http://localhost:5000${user.profilePicture}`} 
                              alt="Profile" 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold">{user.name || 'User'}</h3>
                            <p className="text-gray-500 text-sm">{user.email}</p>
                          </div>
                        </div>
                        <Link
                          to={`/user-profile/${user._id}`}
                          className="block w-full text-center bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition duration-200"
                        >
                          View Profile
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}

      {!query.trim() && (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p>Start typing to search for posts and users</p>
        </div>
      )}
    </div>
  )
}
