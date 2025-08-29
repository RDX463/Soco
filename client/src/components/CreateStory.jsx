import React, { useState, useRef } from 'react'
import { toast } from 'react-toastify'
import api from '../api'

export default function CreateStory({ onClose, onStoryCreated }) {
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaPreview, setMediaPreview] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef()

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be less than 50MB')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Only images and videos are allowed')
      return
    }

    setMediaFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setMediaPreview({
        url: e.target.result,
        type: file.type.startsWith('image/') ? 'image' : 'video'
      })
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!mediaFile) {
      toast.error('Please select an image or video')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('media', mediaFile)
      formData.append('content', content)

      const res = await api.post('/stories', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Story created!')
      onStoryCreated(res.data)
    } catch (err) {
      toast.error('Failed to create story')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Create Story</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Media Upload */}
          <div>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              ref={fileInputRef}
              className="hidden"
            />
            
            {!mediaPreview ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors"
              >
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V8H3a1 1 0 110-2h4zM6 8v11h12V8H6z" />
                </svg>
                <p className="mt-2 text-gray-500">Click to upload image or video</p>
                <p className="text-sm text-gray-400">Max 50MB</p>
              </button>
            ) : (
              <div className="relative">
                {mediaPreview.type === 'image' ? (
                  <img
                    src={mediaPreview.url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={mediaPreview.url}
                    className="w-full h-48 object-cover rounded-lg"
                    controls
                  />
                )}
                <button
                  type="button"
                  onClick={() => {
                    setMediaFile(null)
                    setMediaPreview(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Story Text */}
          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Add text to your story... (optional)"
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              maxLength="500"
            />
            <div className="text-sm text-gray-500 mt-1">
              {content.length}/500 characters
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!mediaFile || loading}
            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Share Story'}
          </button>
        </form>
      </div>
    </div>
  )
}
