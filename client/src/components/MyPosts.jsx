import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMyPosts, deletePost } from '../api'
import { toast } from 'react-toastify'

export default function MyPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMyPosts()
  }, [])

  const loadMyPosts = async () => {
    try {
      const res = await getMyPosts()
      setPosts(res.data)
    } catch (err) {
      toast.error('Failed to load your posts')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await deletePost(postId)
        setPosts(posts.filter(post => post._id !== postId))
        toast.success('Post deleted successfully')
      } catch (err) {
        toast.error('Failed to delete post')
      }
    }
  }

  if (loading) return <div className="text-center p-8">Loading your posts...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Posts ({posts.length})</h1>
        <Link 
          to="/create-post" 
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Create New Post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't created any posts yet.</p>
          <Link 
            to="/create-post" 
            className="bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600"
          >
            Create Your First Post
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map(post => (
            <div key={post._id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="flex">
                {post.image && (
                  <img 
                    src={`http://localhost:5000${post.image}`} 
                    alt={post.title}
                    className="w-48 h-32 object-cover"
                  />
                )}
                
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-bold">{post.title}</h2>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {post.category}
                      </span>
                      <div className="flex space-x-2">
                        <Link 
                          to={`/edit-post/${post._id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </Link>
                        <button 
                          onClick={() => handleDelete(post._id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.content}</p>
                  
                  <div className="flex justify-between items-center text-sm text-gray-500">
                    <div className="flex space-x-4">
                      <span>{post.likeCount} likes</span>
                      <span>{post.views} views</span>
                    </div>
                    <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
