import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { reactToPost, likePost, sharePost } from '../api'
import { getCurrentUser } from '../services/auth'

const REACTIONS = {
  like: { emoji: '👍', label: 'Like', color: 'text-blue-500' },
  love: { emoji: '❤️', label: 'Love', color: 'text-red-500' },
  laugh: { emoji: '😂', label: 'Laugh', color: 'text-yellow-500' },
  wow: { emoji: '😮', label: 'Wow', color: 'text-purple-500' },
  sad: { emoji: '😢', label: 'Sad', color: 'text-blue-400' },
  angry: { emoji: '😡', label: 'Angry', color: 'text-red-600' }
}

export default function PostReactions({ post, onReactionUpdate }) {
  const [showReactions, setShowReactions] = useState(false)
  const [loading, setLoading] = useState(false)
  const currentUser = getCurrentUser()

  const handleReaction = async (reactionType) => {
    if (loading) return
    
    setLoading(true)
    try {
      console.log('Sending reaction:', reactionType, 'to post:', post._id) // Debug log
      const res = await reactToPost(post._id, reactionType)
      console.log('Reaction response:', res.data) // Debug log
      
      onReactionUpdate(res.data)
      setShowReactions(false)
      toast.success(`Reacted ${REACTIONS[reactionType].emoji}`)
    } catch (err) {
      console.error('Reaction error:', err)
      toast.error('Failed to react to post')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      console.log('Liking post:', post._id) // Debug log
      const res = await likePost(post._id)
      console.log('Like response:', res.data) // Debug log
      
      onReactionUpdate(res.data)
      toast.success('Post liked!')
    } catch (err) {
      console.error('Like error:', err)
      toast.error('Failed to like post')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (loading) return
    
    setLoading(true)
    try {
      await sharePost(post._id)
      toast.success('Post shared!')
      // Optionally refresh the post data
    } catch (err) {
      console.error('Share error:', err)
      toast.error('Failed to share post')
    } finally {
      setLoading(false)
    }
  }

  const getUserReaction = () => {
    if (!currentUser || !post.reactions) return null
    
    for (const [reaction, users] of Object.entries(post.reactions || {})) {
      if (Array.isArray(users) && users.some(userId => userId.toString() === currentUser.id)) {
        return reaction
      }
    }
    return null
  }

  const getTotalReactions = () => {
    if (!post.reactions) return 0
    
    let total = 0
    Object.values(post.reactions).forEach(users => {
      if (Array.isArray(users)) {
        total += users.length
      }
    })
    return total
  }

  const getLikeCount = () => {
    const likesArray = post.likes || []
    const reactionLikes = post.reactions?.like || []
    const likeCountProp = post.likeCount || 0
    
    const counts = [
      Array.isArray(likesArray) ? likesArray.length : 0,
      Array.isArray(reactionLikes) ? reactionLikes.length : 0,
      typeof likeCountProp === 'number' && !isNaN(likeCountProp) ? likeCountProp : 0
    ]
    
    return Math.max(...counts)
  }

  const currentReaction = getUserReaction()
  const totalReactions = getTotalReactions()
  const likeCount = getLikeCount()
  const isLiked = Array.isArray(post.likes) && post.likes.some(userId => userId.toString() === currentUser?.id)
  
  const hasReactionSystem = post.reactions && Object.keys(post.reactions).length > 0
  const displayCount = hasReactionSystem ? totalReactions : likeCount

  return (
    <div className="flex items-center justify-between pt-4 border-t">
      <div className="flex items-center space-x-6">
        {/* Like/Reactions */}
        <div className="relative">
          <button
            onClick={hasReactionSystem ? () => setShowReactions(!showReactions) : handleLike}
            onMouseEnter={() => hasReactionSystem && setShowReactions(true)}
            onMouseLeave={() => setTimeout(() => setShowReactions(false), 300)}
            disabled={loading}
            className={`flex items-center space-x-1 transition-colors disabled:opacity-50 ${
              currentReaction ? REACTIONS[currentReaction].color : 
              isLiked ? 'text-blue-500' : 'text-gray-500 hover:text-blue-500'
            }`}
          >
            <span className="text-lg">
              {loading ? '⏳' : currentReaction ? REACTIONS[currentReaction].emoji : '👍'}
            </span>
            <span className="text-sm">
              {currentReaction ? REACTIONS[currentReaction].label : 'Like'}
            </span>
            <span className="text-sm text-gray-500">
              ({displayCount})
            </span>
          </button>

          {/* Reaction Picker */}
          {showReactions && hasReactionSystem && (
            <div 
              className="absolute bottom-full left-0 mb-2 bg-white rounded-full shadow-lg border p-2 flex space-x-1 z-20"
              onMouseEnter={() => setShowReactions(true)}
              onMouseLeave={() => setShowReactions(false)}
            >
              {Object.entries(REACTIONS).map(([reaction, config]) => (
                <button
                  key={reaction}
                  onClick={() => handleReaction(reaction)}
                  disabled={loading}
                  className="p-2 rounded-full hover:bg-gray-100 transform hover:scale-125 transition-all duration-200 disabled:opacity-50"
                  title={config.label}
                >
                  <span className="text-2xl">{config.emoji}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Comment Button */}
        <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="text-sm">Comment</span>
        </button>

        {/* Share Button */}
        <button 
          onClick={handleShare}
          disabled={loading}
          className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
          <span className="text-sm">Share</span>
          {post.shares && Array.isArray(post.shares) && post.shares.length > 0 && (
            <span className="text-sm text-gray-500">({post.shares.length})</span>
          )}
        </button>
      </div>
    </div>
  )
}
