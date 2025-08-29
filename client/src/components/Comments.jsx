import React, { useState, useEffect, useCallback } from 'react'
import { getComments, createComment, deleteComment } from '../api' // Fixed import
import { getCurrentUser } from '../services/auth'
import { toast } from 'react-toastify'

export default function Comments({ postId, onCommentAdded }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const user = getCurrentUser()

  // Memoize loadComments to fix eslint warning
  const loadComments = useCallback(async () => {
    try {
      const res = await getComments(postId)
      setComments(res.data)
    } catch (err) {
      toast.error('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [postId])

  useEffect(() => {
    if (showComments) {
      loadComments()
    }
  }, [showComments, loadComments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSubmitting(true)
    try {
      const res = await createComment({
        content: newComment,
        postId: postId
      })
      setComments([res.data, ...comments])
      setNewComment('')
      toast.success('Comment added!')
      if (onCommentAdded) onCommentAdded()
    } catch (err) {
      toast.error('Failed to add comment')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId) => {
    if (window.confirm('Delete this comment?')) {
      try {
        await deleteComment(commentId)
        setComments(comments.filter(c => c._id !== commentId))
        toast.success('Comment deleted')
      } catch (err) {
        toast.error('Failed to delete comment')
      }
    }
  }

  return (
    <div className="border-t pt-4">
      <button
        onClick={() => setShowComments(!showComments)}
        className="text-blue-600 hover:text-blue-800 text-sm mb-4 flex items-center space-x-1"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{showComments ? 'Hide Comments' : `View Comments (${comments.length})`}</span>
      </button>

      {showComments && (
        <div className="space-y-4">
          {/* Add Comment Form */}
          <form onSubmit={handleSubmit} className="flex space-x-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
            </div>
            <input
              type="text"
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50 transition duration-200"
            >
              {submitting ? 'Posting...' : 'Post'}
            </button>
          </form>

          {/* Comments List */}
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-gray-500 text-sm py-4 text-center">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.map(comment => (
                <div key={comment._id} className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {comment.author.name?.charAt(0).toUpperCase() || comment.author.email?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-sm">{comment.author.name || 'User'}</span>
                      <span className="text-gray-500 text-xs">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {comment.author._id === user?.id && (
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 ml-8">{comment.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
