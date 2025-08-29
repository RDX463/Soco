import express from 'express'
import Post from '../models/Post.js'
import auth from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import Notification from '../models/Notification.js'
import { uploadPost } from '../config/cloudinary.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname))
  }
})

// Update multer configuration for multiple files
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for videos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Only images and videos are allowed'), false)
    }
  }
})

// GET all posts
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// CREATE post
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { title, content, category, tags } = req.body
    
    const postData = {
      title,
      content,
      author: req.userId,
      category: category || 'General',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    }
    
    if (req.file) {
      postData.image = `/uploads/${req.file.filename}`
    }
    
    const post = new Post(postData)
    await post.save()
    
    const populatedPost = await Post.findById(post._id).populate('author', 'name email')
    res.status(201).json(populatedPost)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// LIKE/UNLIKE post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    
    const likeIndex = post.likes.indexOf(req.userId)
    
    if (likeIndex > -1) {
      // Unlike
      post.likes.splice(likeIndex, 1)
    } else {
      // Like
      post.likes.push(req.userId)
    }
    
    await post.save()
    
    const populatedPost = await Post.findById(post._id).populate('author', 'name email')
    res.json(populatedPost)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add this route BEFORE the /:id route
router.get('/my-posts', auth, async (req, res) => {
  try {
    const posts = await Post.find({ author: req.userId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
    res.json(posts)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'name email')
    
    if (!post) return res.status(404).json({ error: 'Post not found' })
    res.json(post)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// UPDATE post
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    
    // Check if user owns the post
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    
    const { title, content, category, tags } = req.body
    
    const updateData = {
      title,
      content,
      category,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    }
    
    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`
    }
    
    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate('author', 'name email')
    
    res.json(updatedPost)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })
    
    if (post.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    
    await Post.findByIdAndDelete(req.params.id)
    res.json({ message: 'Post deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add search route
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    const searchRegex = new RegExp(q, 'i')
    
    const posts = await Post.find({
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]
    }).populate('author', 'name profilePicture').limit(20)
    
    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    }).select('-password').limit(20)
    
    res.json({ posts, users })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Add these routes to your existing posts.js file

// POST share a post
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { content } = req.body // Optional comment when sharing
    const originalPost = await Post.findById(req.params.id)
    
    if (!originalPost) {
      return res.status(404).json({ error: 'Post not found' })
    }

    // Create shared post
    const sharedPost = new Post({
      title: `Shared: ${originalPost.title}`,
      content: content || `Check out this post!`,
      author: req.userId,
      originalPost: originalPost._id,
      isShared: true,
      category: originalPost.category,
      tags: originalPost.tags
    })

    await sharedPost.save()

    // Add to original post's shares
    originalPost.shares.push({
      user: req.userId,
      sharedAt: new Date()
    })
    await originalPost.save()

    // Populate the shared post
    const populatedPost = await Post.findById(sharedPost._id)
      .populate('author', 'name email profilePicture')
      .populate({
        path: 'originalPost',
        populate: {
          path: 'author',
          select: 'name email profilePicture'
        }
      })

    // Create notification for original author
    if (originalPost.author.toString() !== req.userId) {
      const notification = new Notification({
        recipient: originalPost.author,
        sender: req.userId,
        type: 'share',
        message: 'shared your post'
      })
      await notification.save()

      // Send real-time notification
      const io = req.app.get('io')
      io.emit('notification', {
        recipientId: originalPost.author.toString(),
        type: 'share',
        message: 'shared your post',
        sender: { _id: req.userId, name: req.user?.name }
      })
    }

    res.status(201).json(populatedPost)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// POST react to a post (enhanced reactions)
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { reactionType } = req.body
    const post = await Post.findById(req.params.id)
    
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ error: 'Invalid reaction type' })
    }

    // Remove user from all reaction types first
    Object.keys(post.reactions).forEach(reaction => {
      post.reactions[reaction] = post.reactions[reaction].filter(
        userId => userId.toString() !== req.userId
      )
    })

    // Add user to the new reaction type
    if (!post.reactions[reactionType]) {
      post.reactions[reactionType] = []
    }
    post.reactions[reactionType].push(req.userId)

    await post.save()

    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name email profilePicture')

    res.json(updatedPost)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Update CREATE post route
router.post('/', auth, upload.array('media', 5), async (req, res) => {
  try {
    const { title, content, category, tags } = req.body
    
    const postData = {
      title,
      content,
      category,
      author: req.userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    }
    
    // Handle multiple media files
    if (req.files && req.files.length > 0) {
      postData.media = req.files.map(file => ({
        url: `/uploads/${file.filename}`,
        type: file.mimetype.startsWith('image/') ? 'image' : 'video'
      }))
    }
    
    const post = new Post(postData)
    await post.save()
    
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name email profilePicture')
    
    res.status(201).json(populatedPost)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// Add this route to your existing posts.js file

// POST react to a post (enhanced reactions)
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { reactionType } = req.body
    const post = await Post.findById(req.params.id)
    
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ error: 'Invalid reaction type' })
    }

    // Initialize reactions object if it doesn't exist
    if (!post.reactions) {
      post.reactions = {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: []
      }
    }

    // Remove user from all reaction types first
    Object.keys(post.reactions).forEach(reaction => {
      if (Array.isArray(post.reactions[reaction])) {
        post.reactions[reaction] = post.reactions[reaction].filter(
          userId => userId.toString() !== req.userId
        )
      }
    })

    // Add user to the new reaction type
    if (!Array.isArray(post.reactions[reactionType])) {
      post.reactions[reactionType] = []
    }
    post.reactions[reactionType].push(req.userId)

    // Mark the reactions field as modified (important for nested objects)
    post.markModified('reactions')
    await post.save()

    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name email profilePicture')

    res.json(updatedPost)
  } catch (err) {
    console.error('Reaction error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Also update the existing like route to work with both systems
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const userIndex = post.likes.indexOf(req.userId)
    
    if (userIndex > -1) {
      // User already liked, so unlike
      post.likes.splice(userIndex, 1)
    } else {
      // Add like
      post.likes.push(req.userId)
    }

    await post.save()
    
    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name email profilePicture')

    res.json(updatedPost)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// Update the reaction route to include notifications
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { reactionType } = req.body
    const post = await Post.findById(req.params.id)
    
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ error: 'Invalid reaction type' })
    }

    // Initialize reactions object if it doesn't exist
    if (!post.reactions) {
      post.reactions = {
        like: [],
        love: [],
        laugh: [],
        wow: [],
        sad: [],
        angry: []
      }
    }

    // Remove user from all reaction types first
    Object.keys(post.reactions).forEach(reaction => {
      if (Array.isArray(post.reactions[reaction])) {
        post.reactions[reaction] = post.reactions[reaction].filter(
          userId => userId.toString() !== req.userId
        )
      }
    })

    // Add user to the new reaction type
    if (!Array.isArray(post.reactions[reactionType])) {
      post.reactions[reactionType] = []
    }
    post.reactions[reactionType].push(req.userId)

    post.markModified('reactions')
    await post.save()

    // Create notification for post author (if not self-reaction)
    if (post.author.toString() !== req.userId) {
      const reactionEmojis = {
        like: '👍',
        love: '❤️',
        laugh: '😂',
        wow: '😮',
        sad: '😢',
        angry: '😡'
      }

      const notification = new Notification({
        recipient: post.author,
        sender: req.userId,
        type: 'reaction',
        message: `reacted ${reactionEmojis[reactionType]} to your post`,
        relatedPost: post._id
      })
      await notification.save()
    }

    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name email profilePicture')

    res.json(updatedPost)
  } catch (err) {
    console.error('Reaction error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Make sure this route exists in your posts.js
router.post('/:id/react', auth, async (req, res) => {
  try {
    const { reactionType } = req.body
    console.log('Reaction request:', { postId: req.params.id, reactionType, userId: req.userId }) // Debug
    
    const post = await Post.findById(req.params.id)
    if (!post) return res.status(404).json({ error: 'Post not found' })

    const validReactions = ['like', 'love', 'laugh', 'wow', 'sad', 'angry']
    if (!validReactions.includes(reactionType)) {
      return res.status(400).json({ error: 'Invalid reaction type' })
    }

    // Initialize reactions if not exist
    if (!post.reactions) {
      post.reactions = {
        like: [], love: [], laugh: [], wow: [], sad: [], angry: []
      }
    }

    // Remove from all reactions
    Object.keys(post.reactions).forEach(reaction => {
      if (Array.isArray(post.reactions[reaction])) {
        post.reactions[reaction] = post.reactions[reaction].filter(
          userId => userId.toString() !== req.userId
        )
      }
    })

    // Add to new reaction
    if (!Array.isArray(post.reactions[reactionType])) {
      post.reactions[reactionType] = []
    }
    post.reactions[reactionType].push(req.userId)

    post.markModified('reactions')
    await post.save()

    const updatedPost = await Post.findById(req.params.id)
      .populate('author', 'name email profilePicture')

    console.log('Reaction saved successfully') // Debug
    res.json(updatedPost)
  } catch (err) {
    console.error('Reaction route error:', err)
    res.status(500).json({ error: err.message })
  }
})

// Replace the existing post creation route
router.post('/', auth, uploadPost.array('media', 5), async (req, res) => {
  try {
    const { title, content, category, tags } = req.body
    
    const postData = {
      title,
      content,
      category,
      author: req.userId,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    }
    
    // Handle Cloudinary files
    if (req.files && req.files.length > 0) {
      postData.media = req.files.map(file => ({
        url: file.path, // Cloudinary URL
        type: file.resource_type === 'video' ? 'video' : 'image'
      }))
    }
    
    const post = new Post(postData)
    await post.save()
    
    const populatedPost = await Post.findById(post._id)
      .populate('author', 'name email profilePicture')
    
    res.status(201).json(populatedPost)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router
