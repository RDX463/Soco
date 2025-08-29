import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { fetchPosts, likePost } from '../api'
import { getCurrentUser } from '../services/auth'
import { toast } from 'react-toastify'
import Comments from './Comments'
import Stories from './Stories'
import PostReactions from './PostReactions'

// Media Gallery Component (moved outside to avoid scope issues)
const MediaGallery = ({ media, title, onPostClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!media || media.length === 0) return null

  if (media.length === 1) {
    const item = media[0]
    return (
      <div className="w-full">
        {item.type === 'image' ? (
          <img 
            src={`http://localhost:5000${item.url}`} 
            alt={title}
            className="w-full h-64 object-cover cursor-pointer"
            onClick={onPostClick}
          />
        ) : (
          <video 
            src={`http://localhost:5000${item.url}`} 
            className="w-full h-64 object-cover"
            controls
            preload="metadata"
          />
        )}
      </div>
    )
  }

  return (
    <div className="relative w-full">
      {/* Current Media */}
      <div className="w-full h-64 relative overflow-hidden">
        {media[currentIndex].type === 'image' ? (
          <img 
            src={`http://localhost:5000${media[currentIndex].url}`} 
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <video 
            src={`http://localhost:5000${media[currentIndex].url}`} 
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          />
        )}
        
        {/* Navigation Arrows */}
        {media.length > 1 && (
          <>
            <button
              onClick={() => setCurrentIndex(prev => prev > 0 ? prev - 1 : media.length - 1)}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentIndex(prev => prev < media.length - 1 ? prev + 1 : 0)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
        
        {/* Dots Indicator */}
        {media.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PostList() {
  const [posts, setPosts] = useState([])
  const [filteredPosts, setFilteredPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const user = getCurrentUser()

  const categories = ['All', 'General', 'Technology', 'Lifestyle', 'Business', 'Education', 'Health', 'Travel']

  const filterPosts = useCallback(() => {
    let filtered = posts

    if (searchTerm) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(post => post.category === selectedCategory)
    }

    setFilteredPosts(filtered)
  }, [posts, searchTerm, selectedCategory])

  useEffect(() => {
    const loadInitialPosts = async () => {
      try {
        const res = await fetchPosts()
        setPosts(res.data)
      } catch (err) {
        toast.error('Failed to load posts')
      } finally {
        setLoading(false)
      }
    }

    loadInitialPosts()

    const interval = setInterval(async () => {
      try {
        const res = await fetchPosts()
        setPosts(res.data)
      } catch (err) {
        console.error('Failed to refresh posts')
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    filterPosts()
  }, [filterPosts])

  const handleLike = async (postId) => {
    try {
      const res = await likePost(postId)
      setPosts(posts.map(post => 
        post._id === postId ? res.data : post
      ))
    } catch (err) {
      toast.error('Failed to like post')
    }
  }

  const handlePostClick = async (postId) => {
    try {
      await fetch(`http://localhost:5000/api/posts/${postId}`)
      const res = await fetchPosts()
      setPosts(res.data)
    } catch (err) {
      console.error('Failed to update view count')
    }
  }

  const handleReactionUpdate = (updatedPost) => {
    setPosts(posts.map(post => 
      post._id === updatedPost._id ? updatedPost : post
    ))
  }

  if (loading) return <div className="text-center p-8">Loading posts...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Stories Section */}
      <Stories />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Feed</h1>
        
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <div className="text-sm text-gray-600 mb-4">
          Showing {filteredPosts.length} of {posts.length} posts
        </div>
      </div>

      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">
            {searchTerm || selectedCategory !== 'All' 
              ? 'No posts match your search criteria.' 
              : 'No posts available yet.'
            }
          </p>
          {!searchTerm && selectedCategory === 'All' && (
            <Link 
              to="/create-post" 
              className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600"
            >
              Be the first to create a post!
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredPosts.map(post => (
            <div key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              {/* Media Display */}
              {(post.media && post.media.length > 0) ? (
                <MediaGallery 
                  media={post.media} 
                  title={post.title} 
                  onPostClick={() => handlePostClick(post._id)}
                />
              ) : post.image && (
                <img 
                  src={`http://localhost:5000${post.image}`} 
                  alt={post.title}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => handlePostClick(post._id)}
                />
              )}
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h2 
                    className="text-xl font-bold hover:text-blue-600 cursor-pointer"
                    onClick={() => handlePostClick(post._id)}
                  >
                    {post.title}
                  </h2>
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {post.category}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-3">{post.content}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex justify-between items-center mb-4">
                  <div className="text-sm text-gray-500">
                    By <span className="font-semibold">{post.author.name}</span> • {new Date(post.createdAt).toLocaleDateString()}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-500 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      {post.views}
                    </span>
                  </div>
                </div>

                {/* Enhanced Reactions */}
                <PostReactions 
                  post={post} 
                  onReactionUpdate={handleReactionUpdate}
                />

                {/* Comments Component */}
                <Comments postId={post._id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
