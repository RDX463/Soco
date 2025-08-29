import mongoose from 'mongoose'

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  
  // Enhanced media support
  media: [{
    url: { type: String },
    type: { 
      type: String, 
      enum: ['image', 'video'],
      required: true 
    },
    caption: { type: String }
  }],
  
  // Legacy image support for backward compatibility
  image: { type: String },
  
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  category: { 
    type: String, 
    enum: ['General', 'Technology', 'Lifestyle', 'Business', 'Education', 'Health', 'Travel'],
    default: 'General'
  },
  tags: [{ type: String }],
  
  // Enhanced reactions system with default empty arrays
  reactions: {
    like: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    love: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    laugh: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    wow: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    sad: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
    angry: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }
  },
  
  // Legacy like system for backward compatibility
  likes: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },
  
  views: { type: Number, default: 0 },
  shares: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sharedAt: { type: Date, default: Date.now }
  }],
  
  originalPost: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  },
  isShared: { type: Boolean, default: false }
  
}, { timestamps: true })

// Virtual for total reactions count
PostSchema.virtual('reactionCount').get(function() {
  if (!this.reactions) return 0
  return Object.values(this.reactions).reduce((total, reactions) => {
    return total + (Array.isArray(reactions) ? reactions.length : 0)
  }, 0)
})

// Virtual for like count (backward compatibility)
PostSchema.virtual('likeCount').get(function() {
  const likesCount = Array.isArray(this.likes) ? this.likes.length : 0
  const reactionLikesCount = Array.isArray(this.reactions?.like) ? this.reactions.like.length : 0
  return likesCount + reactionLikesCount
})

export default mongoose.model('Post', PostSchema)
