import mongoose from 'mongoose'

const StorySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    maxlength: 500
  },
  media: {
    type: String, // Image or video path
    required: true
  },
  mediaType: {
    type: String,
    enum: ['image', 'video'],
    required: true
  },
  viewers: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    expires: 0
  }
}, { timestamps: true })

// Index for automatic deletion
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export default mongoose.model('Story', StorySchema)
