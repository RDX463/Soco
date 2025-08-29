import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getMessages, sendMessage, getUserProfile } from '../api'
import { getCurrentUser } from '../services/auth'
import { toast } from 'react-toastify'
import api from '../api'

export default function Chat() {
  const { id } = useParams() // recipient user id
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [recipient, setRecipient] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentUser = getCurrentUser()
  const messagesEndRef = useRef(null)

  // Memoize loadMessages to fix eslint warning
  const loadMessages = useCallback(async () => {
    try {
      const res = await getMessages(id)
      setMessages(res.data)
    } catch (err) {
      toast.error('Failed to load messages')
    }
  }, [id])

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load recipient info and messages
        const recipientRes = await getUserProfile(id)
        setRecipient(recipientRes.data)
        await loadMessages()
      } catch (err) {
        toast.error('Failed to load chat data')
      } finally {
        setLoading(false)
      }
    }

    loadData()

    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000)
    return () => clearInterval(interval)
  }, [id, loadMessages])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!content.trim()) return

    try {
      const res = await sendMessage({ recipientId: id, content })
      setMessages(prev => [...prev, res.data])
      setContent('')
    } catch (err) {
      toast.error('Failed to send message')
    }
  }

  const handleDeleteMessage = async (messageId) => {
    if (window.confirm('Delete this message?')) {
      try {
        await api.delete(`/messages/${messageId}`)
        setMessages(prev => prev.filter(msg => msg._id !== messageId))
        toast.success('Message deleted')
      } catch (err) {
        toast.error('Failed to delete message')
      }
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  const isSentByCurrentUser = (message) => {
    return message.sender._id === currentUser.id || message.sender === currentUser.id
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Chat Header */}
      <div className="bg-white rounded-t-lg shadow-md p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link to="/messages" className="text-blue-600 hover:text-blue-800">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
            {recipient?.profilePicture ? (
              <img 
                src={`http://localhost:5000${recipient.profilePicture}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                {recipient?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            
            <div>
              <h2 className="text-lg font-semibold">{recipient?.name || 'User'}</h2>
              <p className="text-sm text-gray-500">
                {messages.length > 0 ? `${messages.length} messages` : 'No messages yet'}
              </p>
            </div>
          </div>
          
          <Link 
            to={`/user-profile/${id}`}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View Profile
          </Link>
        </div>
      </div>

      {/* Messages Area */}
      <div className="bg-white shadow-md" style={{ height: '500px' }}>
        <div className="h-full overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isCurrentUser = isSentByCurrentUser(msg)
              const showAvatar = index === 0 || 
                isSentByCurrentUser(messages[index - 1]) !== isCurrentUser ||
                new Date(msg.createdAt).getTime() - new Date(messages[index - 1].createdAt).getTime() > 300000 // 5 minutes
              
              return (
                <div key={msg._id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md`}>
                    {/* Avatar */}
                    <div className="w-8 h-8 flex-shrink-0">
                      {showAvatar && (
                        <>
                          {isCurrentUser ? (
                            currentUser.profilePicture ? (
                              <img 
                                src={`http://localhost:5000${currentUser.profilePicture}`} 
                                alt="Your avatar" 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {currentUser.name?.charAt(0).toUpperCase() || 'Y'}
                              </div>
                            )
                          ) : (
                            recipient?.profilePicture ? (
                              <img 
                                src={`http://localhost:5000${recipient.profilePicture}`} 
                                alt="Their avatar" 
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                {recipient?.name?.charAt(0).toUpperCase() || 'U'}
                              </div>
                            )
                          )}
                        </>
                      )}
                    </div>
                    
                    {/* Message Bubble */}
                    <div className="group relative">
                      <div 
                        className={`px-4 py-2 rounded-2xl ${
                          isCurrentUser 
                            ? 'bg-blue-500 text-white rounded-br-md' 
                            : 'bg-gray-100 text-gray-800 rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                      </div>
                      
                      {/* Timestamp and Actions */}
                      <div className={`flex items-center mt-1 text-xs text-gray-500 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                        <span>
                          {new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        
                        {isCurrentUser && (
                          <button
                            onClick={() => handleDeleteMessage(msg._id)}
                            className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-opacity"
                            title="Delete message"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white rounded-b-lg shadow-md p-4 border-t">
        <form onSubmit={handleSend} className="flex space-x-3">
          <div className="flex-1">
            <input
              type="text"
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full border border-gray-300 px-4 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder={`Message ${recipient?.name || 'user'}...`}
              onKeyPress={handleKeyPress}
            />
          </div>
          <button
            type="submit"
            disabled={!content.trim()}
            className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  )
}
