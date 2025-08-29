import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const server = createServer(app)

// Production CORS settings
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://your-app.vercel.app', 
      'https://your-app-git-main-yourusername.vercel.app',
      /\.vercel\.app$/
    ]
  : ['http://localhost:3000']

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))

// Socket.IO with production settings
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
})

// Middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Health check for Railway
app.get('/', (req, res) => {
  res.json({ 
    message: 'SocialHub API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// MongoDB Connection with better error handling
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err)
    process.exit(1)
  })

// Socket.IO logic (your existing code)
const activeUsers = new Map()

io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join', (userId) => {
    activeUsers.set(userId, socket.id)
    socket.userId = userId
    socket.broadcast.emit('userOnline', userId)
  })

  socket.on('disconnect', () => {
    if (socket.userId) {
      activeUsers.delete(socket.userId)
      socket.broadcast.emit('userOffline', socket.userId)
    }
  })
})

app.set('io', io)

// Your existing routes
import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import postRoutes from './routes/posts.js'
import commentRoutes from './routes/comments.js'
import messageRoutes from './routes/messages.js'
import searchRoutes from './routes/search.js'
import notificationRoutes from './routes/notifications.js'
import storyRoutes from './routes/stories.js'

app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/posts', postRoutes)
app.use('/api/comments', commentRoutes)
app.use('/api/messages', messageRoutes)
app.use('/api/search', searchRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/stories', storyRoutes)

const PORT = process.env.PORT || 5000
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
