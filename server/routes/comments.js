import express from 'express'
import Comment from '../models/Comment.js'
import auth from '../middleware/auth.js'

const router = express.Router()

// GET comments for a post
router.get('/post/:postId', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
    res.json(comments)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// CREATE comment
router.post('/', auth, async (req, res) => {
  try {
    const { content, postId } = req.body
    
    const comment = new Comment({
      content,
      author: req.userId,
      post: postId
    })
    
    await comment.save()
    
    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email')
    
    res.status(201).json(populatedComment)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

// DELETE comment
router.delete('/:id', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ error: 'Comment not found' })
    
    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' })
    }
    
    await Comment.findByIdAndDelete(req.params.id)
    res.json({ message: 'Comment deleted successfully' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
