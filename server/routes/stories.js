import express from 'express'
import Story from '../models/Story.js'
import auth from '../middleware/auth.js'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import { uploadStory } from '../config/cloudinary.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Configure multer for story uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/stories/')
  },
  filename: (req, file, cb) => {
    cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB for videos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true)
    } else {
      cb(new Error('Only images and videos allowed'), false)
    }
  }
})

// GET all active stories
router.get('/', auth, async (req, res) => {
  try {
    const stories = await Story.aggregate([
      {
        $match: {
          expiresAt: { $gt: new Date() }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: '$author',
          stories: { $push: '$$ROOT' },
          latestStory: { $first: '$$ROOT' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { password: 0 } }]
        }
      },
      {
        $unwind: '$author'
      },
      {
        $sort: { 'latestStory.createdAt': -1 }
      }
    ])

    res.json(stories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET stories by user ID
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const stories = await Story.find({
      author: req.params.userId,
      expiresAt: { $gt: new Date() }
    })
    .populate('author', 'name profilePicture')
    .sort({ createdAt: -1 })

    res.json(stories)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST create story
router.post('/', auth, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' })
    }

    const { content } = req.body
    const mediaType = req.file.mimetype.startsWith('image/') ? 'image' : 'video'

    const story = new Story({
      author: req.userId,
      content,
      media: `/uploads/stories/${req.file.filename}`,
      mediaType
    })

    await story.save()

    const populatedStory = await Story.findById(story._id)
      .populate('author', 'name profilePicture')

    res.status(201).json(populatedStory)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// POST view story
router.post('/:id/view', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
    if (!story) return res.status(404).json({ error: 'Story not found' })

    // Don't add view if user already viewed
    const alreadyViewed = story.viewers.some(
      viewer => viewer.user.toString() === req.userId
    )

    if (!alreadyViewed) {
      story.viewers.push({ user: req.userId })
      await story.save()
    }

    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET story viewers
router.get('/:id/viewers', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
      .populate('viewers.user', 'name profilePicture')

    if (!story) return res.status(404).json({ error: 'Story not found' })
    
    // Only story author can see viewers
    if (story.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    res.json(story.viewers)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE story
router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id)
    if (!story) return res.status(404).json({ error: 'Story not found' })
    
    if (story.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }

    await Story.findByIdAndDelete(req.params.id)
    res.json({ message: 'Story deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// Replace story creation route
router.post('/', auth, uploadStory.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Media file is required' })
    }

    const { content } = req.body
    const mediaType = req.file.resource_type === 'video' ? 'video' : 'image'

    const story = new Story({
      author: req.userId,
      content,
      media: req.file.path, // Cloudinary URL
      mediaType
    })

    await story.save()
    const populatedStory = await Story.findById(story._id)
      .populate('author', 'name profilePicture')

    res.status(201).json(populatedStory)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

export default router
