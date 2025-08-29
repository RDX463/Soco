import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { fetchUsers, followUser, unfollowUser } from '../api'
import { getCurrentUser } from '../services/auth'
import api from '../api'

export default function Community() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [followingList, setFollowingList] = useState([])
  const [followingInProgress, setFollowingInProgress] = useState(new Set())
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadUsers()
    loadFollowingList()
  }, [])

  const loadUsers = async () => {
    try {
      console.log('Loading users...') // Debug log
      const res = await fetchUsers()
      console.log('Users loaded:', res.data) // Debug log
      setUsers(res.data)
    } catch (err) {
      console.error('Error loading users:', err)
      toast.error('Failed to load community members')
    } finally {
      setLoading(false)
    }
  }

  const loadFollowingList = async () => {
    try {
      const res = await api.get('/users/profile')
      const following = res.data.following || []
      setFollowingList(following.map(user => user._id || user))
    } catch (err) {
      console.error('Failed to load following list:', err)
    }
  }

  const handleFollow = async (userId) => {
    if (followingInProgress.has(userId)) return
    
    setFollowingInProgress(prev => new Set(prev.add(userId)))
    
    try {
      console.log('Following user:', userId) // Debug log
      await followUser(userId)
      setFollowingList(prev => [...prev, userId])
      toast.success('User followed!')
    } catch (err) {
      console.error('Follow error:', err)
      toast.error('Failed to follow user')
    } finally {
      setFollowingInProgress(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const handleUnfollow = async (userId) => {
    if (followingInProgress.has(userId)) return
    
    setFollowingInProgress(prev => new Set(prev.add(userId)))
    
    try {
      console.log('Unfollowing user:', userId) // Debug log
      await unfollowUser(userId)
      setFollowingList(prev => prev.filter(id => id !== userId))
      toast.info('User unfollowed')
    } catch (err) {
      console.error('Unfollow error:', err)
      toast.error('Failed to unfollow user')
    } finally {
      setFollowingInProgress(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
    }
  }

  const isFollowing = (userId) => followingList.includes(userId)

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
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Community Members ({users.length})</h1>
        <p className="text-gray-600">Connect with other members of our community</p>
      </div>

      {users.length === 0 ? (
        <div className="text-center py-12">
          <div className="mb-4">
            <svg className="w-16 h-16 text-gray-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-gray-500 mb-4">No community members found.</p>
          <p className="text-sm text-gray-400">Members will appear here once they register.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <div key={user._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center space-x-4 mb-4">
                {user.profilePicture ? (
                  <img 
                    src={`http://localhost:5000${user.profilePicture}`} 
                    alt="Profile" 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{user.name || 'User'}</h3>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
              </div>
              
              <div className="text-sm text-gray-600 mb-4 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                {user.followers?.length || 0} followers
              </div>
              
              <div className="flex flex-col space-y-2">
                <Link 
                  to={`/user-profile/${user._id}`}
                  className="w-full bg-blue-500 text-white text-center py-2 px-4 rounded-md hover:bg-blue-600 text-sm transition duration-200"
                >
                  View Profile
                </Link>
                
                {user._id !== currentUser?.id && (
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => isFollowing(user._id) ? handleUnfollow(user._id) : handleFollow(user._id)}
                      disabled={followingInProgress.has(user._id)}
                      className={`flex-1 px-4 py-2 rounded-md text-sm transition duration-200 ${
                        followingInProgress.has(user._id)
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : isFollowing(user._id) 
                            ? 'bg-red-500 text-white hover:bg-red-600' 
                            : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {followingInProgress.has(user._id) 
                        ? 'Loading...' 
                        : isFollowing(user._id) 
                          ? 'Unfollow' 
                          : 'Follow'
                      }
                    </button>
                    
                    <Link 
                      to={`/chat/${user._id}`}
                      className="flex-1 px-4 py-2 border border-blue-500 text-blue-500 rounded-md hover:bg-blue-50 text-sm transition duration-200 text-center"
                    >
                      Message
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
