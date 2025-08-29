import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getConversations } from '../api'
import { getCurrentUser } from '../services/auth'
import { toast } from 'react-toastify'

export default function Messages() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadConversations()
    
    // Refresh conversations every 10 seconds
    const interval = setInterval(loadConversations, 10000)
    return () => clearInterval(interval)
  }, [])

  const loadConversations = async () => {
    try {
      const res = await getConversations()
      console.log('Conversations loaded:', res.data) // Debug log
      setConversations(res.data)
    } catch (err) {
      console.error('Conversations error:', err)
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Messages</h1>
        <Link 
          to="/community" 
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>New Chat</span>
        </Link>
      </div>

      {conversations.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No conversations yet</h3>
          <p className="text-gray-500 mb-6">Start chatting with members of the community</p>
          <Link 
            to="/community" 
            className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600"
          >
            Browse Community
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="divide-y divide-gray-200">
            {conversations.map(conv => (
              <Link
                key={conv._id}
                to={`/chat/${conv.otherUser._id}`}
                className="block hover:bg-gray-50 transition-colors"
              >
                <div className="p-4 flex items-center space-x-4">
                  {/* Avatar */}
                  {conv.otherUser.profilePicture ? (
                    <img 
                      src={`http://localhost:5000${conv.otherUser.profilePicture}`} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {conv.otherUser.name?.charAt(0).toUpperCase() || conv.otherUser.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Conversation Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {conv.otherUser.name || 'User'}
                      </h3>
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        {conv.unreadCount > 0 && (
                          <div className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {conv.unreadCount}
                          </div>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(conv.lastMessage.createdAt).toLocaleDateString() === new Date().toLocaleDateString() 
                            ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                            : new Date(conv.lastMessage.createdAt).toLocaleDateString()
                          }
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 truncate">
                      {conv.lastMessage.sender.toString() === currentUser.id ? 'You: ' : ''}
                      {conv.lastMessage.content}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
