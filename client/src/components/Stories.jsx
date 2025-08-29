import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import api from '../api'
import { getCurrentUser } from '../services/auth'
import StoryViewer from './StoryViewer'
import CreateStory from './CreateStory'

export default function Stories() {
  const [stories, setStories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStory, setSelectedStory] = useState(null)
  const [showCreateStory, setShowCreateStory] = useState(false)
  const currentUser = getCurrentUser()

  useEffect(() => {
    loadStories()
  }, [])

  const loadStories = async () => {
    try {
      const res = await api.get('/stories')
      setStories(res.data)
    } catch (err) {
      toast.error('Failed to load stories')
    } finally {
      setLoading(false)
    }
  }

  const handleStoryCreated = (newStory) => {
    loadStories() // Refresh stories
    setShowCreateStory(false)
  }

  if (loading) {
    return (
      <div className="flex space-x-4 p-4 overflow-x-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex-shrink-0 animate-pulse">
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {/* Create Story Button */}
        <div className="flex-shrink-0 text-center">
          <button
            onClick={() => setShowCreateStory(true)}
            className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <p className="text-xs mt-1 text-gray-600">Add Story</p>
        </div>

        {/* Story Rings */}
        {stories.map(storyGroup => (
          <div key={storyGroup._id} className="flex-shrink-0 text-center">
            <button
              onClick={() => setSelectedStory(storyGroup)}
              className="relative w-16 h-16 p-1 bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 rounded-full hover:scale-105 transition-transform"
            >
              {storyGroup.author.profilePicture ? (
                <img
                  src={`http://localhost:5000${storyGroup.author.profilePicture}`}
                  alt={storyGroup.author.name}
                  className="w-full h-full rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-gray-400 flex items-center justify-center text-white font-bold border-2 border-white">
                  {storyGroup.author.name?.charAt(0).toUpperCase()}
                </div>
              )}
              
              {/* New story indicator */}
              {storyGroup.stories.some(story => 
                !story.viewers.some(viewer => viewer.user === currentUser.id)
              ) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
              )}
            </button>
            <p className="text-xs mt-1 text-gray-600 truncate max-w-16">
              {storyGroup.author._id === currentUser.id ? 'Your Story' : storyGroup.author.name}
            </p>
          </div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <StoryViewer
          storyGroup={selectedStory}
          onClose={() => setSelectedStory(null)}
          onStoryChange={loadStories}
        />
      )}

      {/* Create Story Modal */}
      {showCreateStory && (
        <CreateStory
          onClose={() => setShowCreateStory(false)}
          onStoryCreated={handleStoryCreated}
        />
      )}
    </div>
  )
}
