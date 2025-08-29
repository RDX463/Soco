import express from 'express'
import Post from '../models/Post.js'
import User from '../models/User.js'

const router = express.Router()

// Search posts and users
router.get('/', async (req, res) => {
  try {
    const { q } = req.query
    
    if (!q || q.trim() === '') {
      return res.json({ posts: [], users: [] })
    }
    
    const searchRegex = new RegExp(q.trim(), 'i')
    
    console.log('Searching for:', q) // Debug log
    
    const [posts, users] = await Promise.all([
      Post.find({
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      })
      .populate('author', 'name profilePicture')
      .sort({ createdAt: -1 })
      .limit(20),
      
      User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      })
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(20)
    ])
    
    console.log('Search results - Posts:', posts.length, 'Users:', users.length) // Debug log
    
    res.json({ posts, users })
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
