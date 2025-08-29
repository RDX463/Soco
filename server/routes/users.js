import express from 'express'
import User from '../models/User.js'
import auth from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { uploadProfile } from '../config/cloudinary.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/')
  },
  filename: (req, file, cb) => {
    cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// GET all users (for community page)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
    
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET current user profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('followers', 'name email')
      .populate('following', 'name email')
    
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT update profile with picture upload
router.put('/profile', auth, upload.single('profilePicture'), async (req, res) => {
  try {
    const { name } = req.body
    const updateData = {}
    
    if (name) updateData.name = name
    
    if (req.file) {
      updateData.profilePicture = `/uploads/profiles/${req.file.filename}`
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId, 
      updateData, 
      { new: true }
    ).select('-password')
    
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(updatedUser)
  } catch (err) {
    console.error('Profile update error:', err)
    res.status(400).json({ error: err.message })
  }
})

// GET user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name email')
      .populate('following', 'name email')
    
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST follow user
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id)
    const currentUser = await User.findById(req.userId)

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    if (userToFollow._id.equals(currentUser._id)) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    // Add follower/following if not already present
    if (!userToFollow.followers.includes(currentUser._id)) {
      userToFollow.followers.push(currentUser._id)
      await userToFollow.save()
    }

    if (!currentUser.following.includes(userToFollow._id)) {
      currentUser.following.push(userToFollow._id)
      await currentUser.save()
    }

    res.json({ message: 'Followed successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST unfollow user
router.post('/:id/unfollow', auth, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id)
    const currentUser = await User.findById(req.userId)

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    userToUnfollow.followers = userToUnfollow.followers.filter(id => !id.equals(currentUser._id))
    await userToUnfollow.save()

    currentUser.following = currentUser.following.filter(id => !id.equals(userToUnfollow._id))
    await currentUser.save()

    res.json({ message: 'Unfollowed successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Replace the existing profile upload route
router.put('/profile', auth, uploadProfile.single('profilePicture'), async (req, res) => {
  try {
    const { name } = req.body
    const updateData = { name }
    
    if (req.file) {
      updateData.profilePicture = req.file.path // This is the Cloudinary URL
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId, 
      updateData, 
      { new: true }
    ).select('-password')
    
    res.json(updatedUser)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router
