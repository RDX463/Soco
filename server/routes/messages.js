import express from 'express'
import Message from '../models/Message.js'
import User from '../models/User.js'
import auth from '../middleware/auth.js'
import mongoose from 'mongoose'

const router = express.Router()

// GET conversations list
router.get('/conversations', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId)
    
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { recipient: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ["$sender", userId] },
              then: "$recipient",
              else: "$sender"
            }
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: {
                if: {
                  $and: [
                    { $eq: ["$recipient", userId] },
                    { $eq: ["$read", false] }
                  ]
                },
                then: 1,
                else: 0
              }
            }
          }
        }
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "otherUser",
          pipeline: [{ 
            $project: { 
              password: 0 
            } 
          }]
        }
      },
      {
        $unwind: "$otherUser"
      },
      {
        $sort: { "lastMessage.createdAt": -1 }
      }
    ])

    res.json(conversations)
  } catch (err) {
    console.error('Conversations error:', err)
    res.status(500).json({ error: err.message })
  }
})

// GET messages between current user and recipient
router.get('/:recipientId', auth, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: req.params.recipientId },
        { sender: req.params.recipientId, recipient: req.userId }
      ]
    })
    .populate('sender', 'name profilePicture')
    .populate('recipient', 'name profilePicture')
    .sort({ createdAt: 1 })
    
    // Mark messages as read
    await Message.updateMany(
      {
        sender: req.params.recipientId,
        recipient: req.userId,
        read: false
      },
      { read: true }
    )
    
    res.json(messages)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST send message
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, content } = req.body
    
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'Message content is required' })
    }
    
    const message = new Message({
      sender: req.userId,
      recipient: recipientId,
      content: content.trim()
    })
    
    await message.save()
    
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name profilePicture')
      .populate('recipient', 'name profilePicture')
    
    res.status(201).json(populatedMessage)
  } catch (err) {
    console.error('Send message error:', err)
    res.status(400).json({ error: err.message })
  }
})

// DELETE message (only sender can delete)
router.delete('/:id', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' })
    }
    
    // Only the sender can delete their message
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own messages' })
    }
    
    await Message.findByIdAndDelete(req.params.id)
    res.json({ message: 'Message deleted successfully' })
  } catch (err) {
    console.error('Delete message error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
