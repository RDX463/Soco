import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getUserProfile, followUser, unfollowUser } from '../api'
import { getCurrentUser } from '../services/auth'
import { toast } from 'react-toastify'
import api from '../api'

export default function UserProfile() {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const currentUser = getCurrentUser()

  useEffect(() => {
    // Define loadUserData inside useEffect to avoid dependency issues
    const loadUserData = async () => {
      try {
        // Load user profile
        const userRes = await getUserProfile(id)
        setUser(userRes.data)
        
        // Load user's posts
        try {
          const postsRes = await api.get(`/posts/user/${id}`)
          setPosts(postsRes.data)
        } catch (err) {
          setPosts([])
        }
        
        // Check if current user follows this user
        if (currentUser) {
          try {
            const myProfileRes = await api.get('/users/profile')
            const following = myProfileRes.data.following || []
            setIsFollowing(following.includes(id))
          } catch (err) {
            console.error('Failed to load following status')
          }
        }
        
      } catch (err) {
        toast.error('Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [id, currentUser]) // Only depend on id and currentUser

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await unfollowUser(id)
        setIsFollowing(false)
        setUser(prev => ({ 
          ...prev, 
          followers: prev.followers.filter(f => f._id !== currentUser.id) 
        }))
        toast.info('Unfollowed user')
      } else {
        await followUser(id)
        setIsFollowing(true)
        setUser(prev => ({ 
          ...prev, 
          followers: [...(prev.followers || []), { _id: currentUser.id }] 
        }))
        toast.success('Following user!')
      }
    } catch (err) {
      toast.error('Failed to update follow status')
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

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <p className="text-gray-500">User not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link to="/community" className="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Community
      </Link>

      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-md p-8 mb-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {user.profilePicture ? (
            <img 
              src={`http://localhost:5000${user.profilePicture}`} 
              alt="Profile" 
              className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
            />
          ) : (
            <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-6xl font-bold border-4 border-gray-200">
              {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
          )}
          
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold mb-2">{user.name || 'User'}</h1>
            <p className="text-gray-600 mb-4">{user.email}</p>
            
            <div className="flex justify-center md:justify-start space-x-8 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{posts.length}</div>
                <div className="text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{user.followers?.length || 0}</div>
                <div className="text-gray-600">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{user.following?.length || 0}</div>
                <div className="text-gray-600">Following</div>
              </div>
            </div>
            
            {currentUser && currentUser.id !== user._id && (
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 justify-center md:justify-start">
                <button
                  onClick={handleFollow}
                  className={`px-6 py-2 rounded-md font-semibold transition duration-200 ${
                    isFollowing 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'bg-blue-500 text-white hover:bg-blue-600'
                  }`}
                >
                  {isFollowing ? 'Unfollow' : 'Follow'}
                </button>
                
                <Link 
                  to={`/chat/${user._id}`}
                  className="px-6 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 font-semibold transition duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span>Message</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User's Posts */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">{user.name}'s Posts</h2>
        
        {posts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No posts yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <div key={post._id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {post.image && (
                  <img 
                    src={`http://localhost:5000${post.image}`} 
                    alt={post.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-2 line-clamp-2">{post.content}</p>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{post.likeCount || 0} likes</span>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
