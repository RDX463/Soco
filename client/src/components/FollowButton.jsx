import React, { useState, useEffect } from 'react'
import api from '../api'
import { toast } from 'react-toastify'
import { getCurrentUser } from '../services/auth'

export default function FollowButton({ userId }) {
  const [following, setFollowing] = useState(false)
  const currentUser = getCurrentUser()

  useEffect(() => {
    // Fetch current user's following list to check
    // You might want to add API for current user's followings if not present.
    // For simplicity, assume you fetch user data elsewhere and pass this info as props.
  }, [userId])

  const handleFollowToggle = async () => {
    try {
      if (following) {
        await api.post(`/users/${userId}/unfollow`)
        setFollowing(false)
        toast.info('Unfollowed user')
      } else {
        await api.post(`/users/${userId}/follow`)
        setFollowing(true)
        toast.success('Followed user')
      }
    } catch (err) {
      toast.error('Failed to change follow status')
    }
  }

  if (!currentUser || currentUser.id === userId) return null

  return (
    <button
      onClick={handleFollowToggle}
      className={`px-4 py-2 rounded-md text-white ${following ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'}`}
    >
      {following ? 'Unfollow' : 'Follow'}
    </button>
  )
}
