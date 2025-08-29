import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import api from '../api'
import { getCurrentUser } from '../services/auth'

export default function StoryViewer({ storyGroup, onClose, onStoryChange }) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [showViewers, setShowViewers] = useState(false)
  const [viewers, setViewers] = useState([])
  const progressIntervalRef = useRef()
  const currentUser = getCurrentUser()
  
  const currentStory = storyGroup.stories[currentStoryIndex]
  const isMyStory = storyGroup.author._id === currentUser.id

  useEffect(() => {
    // Mark story as viewed
    markAsViewed()
    
    // Start progress timer
    startProgressTimer()
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [currentStoryIndex])

  const markAsViewed = async () => {
    try {
      await api.post(`/stories/${currentStory._id}/view`)
    } catch (err) {
      console.error('Failed to mark story as viewed')
    }
  }

  const startProgressTimer = () => {
    setProgress(0)
    const duration = currentStory.mediaType === 'video' ? 10000 : 5000 // 10s for video, 5s for image
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 100))
        if (newProgress >= 100) {
          nextStory()
          return 0
        }
        return newProgress
      })
    }, 100)
  }

  const nextStory = () => {
    if (currentStoryIndex < storyGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1)
    } else {
      onClose()
    }
  }

  const prevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1)
    }
  }

  const deleteStory = async () => {
    if (window.confirm('Delete this story?')) {
      try {
        await api.delete(`/stories/${currentStory._id}`)
        toast.success('Story deleted')
        onStoryChange()
        onClose()
      } catch (err) {
        toast.error('Failed to delete story')
      }
    }
  }

  const loadViewers = async () => {
    if (!isMyStory) return
    
    try {
      const res = await api.get(`/stories/${currentStory._id}/viewers`)
      setViewers(res.data)
      setShowViewers(true)
    } catch (err) {
      toast.error('Failed to load viewers')
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-4 flex space-x-1 z-10">
        {storyGroup.stories.map((_, index) => (
          <div key={index} className="flex-1 h-1 bg-white bg-opacity-30 rounded">
            <div
              className="h-full bg-white rounded transition-all duration-100"
              style={{
                width: index < currentStoryIndex ? '100%' : 
                       index === currentStoryIndex ? `${progress}%` : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-8 left-4 right-4 flex justify-between items-center z-10">
        <div className="flex items-center space-x-3">
          {storyGroup.author.profilePicture ? (
            <img
              src={`http://localhost:5000${storyGroup.author.profilePicture}`}
              alt={storyGroup.author.name}
              className="w-10 h-10 rounded-full border-2 border-white"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold border-2 border-white">
              {storyGroup.author.name?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-white font-semibold">{storyGroup.author.name}</p>
            <p className="text-white text-sm opacity-75">
              {new Date(currentStory.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {isMyStory && (
            <>
              <button
                onClick={loadViewers}
                className="text-white opacity-75 hover:opacity-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                onClick={deleteStory}
                className="text-red-400 hover:text-red-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="text-white opacity-75 hover:opacity-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Story Content */}
      <div className="relative w-full h-full max-w-md mx-auto">
        {currentStory.mediaType === 'image' ? (
          <img
            src={`http://localhost:5000${currentStory.media}`}
            alt="Story"
            className="w-full h-full object-cover"
          />
        ) : (
          <video
            src={`http://localhost:5000${currentStory.media}`}
            className="w-full h-full object-cover"
            autoPlay
            muted
            onEnded={nextStory}
          />
        )}

        {/* Story Text */}
        {currentStory.content && (
          <div className="absolute bottom-20 left-4 right-4">
            <p className="text-white text-center bg-black bg-opacity-50 p-3 rounded-lg">
              {currentStory.content}
            </p>
          </div>
        )}

        {/* Navigation Areas */}
        <button
          onClick={prevStory}
          className="absolute left-0 top-0 w-1/3 h-full z-10"
        />
        <button
          onClick={nextStory}
          className="absolute right-0 top-0 w-1/3 h-full z-10"
        />
      </div>

      {/* Viewers Modal */}
      {showViewers && (
        <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-lg p-4 max-h-80 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Viewers ({viewers.length})</h3>
            <button
              onClick={() => setShowViewers(false)}
              className="text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            {viewers.map(viewer => (
              <div key={viewer.user._id} className="flex items-center space-x-3">
                {viewer.user.profilePicture ? (
                  <img
                    src={`http://localhost:5000${viewer.user.profilePicture}`}
                    alt={viewer.user.name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-sm font-bold">
                    {viewer.user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-medium">{viewer.user.name}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(viewer.viewedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
