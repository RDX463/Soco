import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api'
})

// Add token to all requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Users
export const fetchUsers = () => api.get('/users')
export const createUser = (user) => api.post('/users', user)
export const updateUser = (id, user) => api.put(`/users/${id}`, user)
export const deleteUser = (id) => api.delete(`/users/${id}`)
export const getUserProfile = (userId) => api.get(`/users/${userId}`)
export const updateProfile = (profileData) => api.put('/users/profile', profileData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})

//Post
export const fetchPosts = () => api.get('/posts')
export const getMyPosts = () => api.get('/posts/my-posts')
export const getPost = (id) => api.get(`/posts/${id}`)
export const createPost = (postData) => api.post('/posts', postData)
export const updatePost = (id, postData) => api.put(`/posts/${id}`, postData)
export const deletePost = (id) => api.delete(`/posts/${id}`)
export const likePost = (id) => api.post(`/posts/${id}/like`)

// NEW: Add reaction endpoints
export const reactToPost = (postId, reactionType) => api.post(`/posts/${postId}/react`, { reactionType })
export const sharePost = (postId, content = '') => api.post(`/posts/${postId}/share`, { content })

// Comments
export const getComments = (postId) => api.get(`/comments/post/${postId}`)
export const createComment = (commentData) => api.post('/comments', commentData)
export const deleteComment = (commentId) => api.delete(`/comments/${commentId}`)

// Messages
export const getMessages = (recipientId) => api.get(`/messages/${recipientId}`)
export const sendMessage = (messageData) => api.post('/messages', messageData)
export const getConversations = () => api.get('/messages/conversations')

// Follow
export const followUser = (userId) => api.post(`/users/${userId}/follow`)
export const unfollowUser = (userId) => api.post(`/users/${userId}/unfollow`)

// Search
export const searchAll = (query) => api.get(`/search?q=${encodeURIComponent(query)}`)

// Notifications
export const getNotifications = () => api.get('/notifications')
export const getUnreadNotificationsCount = () => api.get('/notifications/unread-count')
export const markNotificationAsRead = (notificationId) => api.put(`/notifications/${notificationId}/read`)
export const markAllNotificationsAsRead = () => api.put('/notifications/mark-all-read')

// Stories
export const getStories = () => api.get('/stories')
export const createStory = (storyData) => api.post('/stories', storyData)
export const viewStory = (storyId) => api.post(`/stories/${storyId}/view`)
export const deleteStory = (storyId) => api.delete(`/stories/${storyId}`)


export default api
  