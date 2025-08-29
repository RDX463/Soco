import io from 'socket.io-client'
import { getCurrentUser } from './auth'

class SocketService {
  constructor() {
    this.socket = null
    this.connected = false
  }

  connect() {
    const user = getCurrentUser()
    if (!user || this.connected) return

    this.socket = io('http://localhost:5000')
    
    this.socket.on('connect', () => {
      console.log('Connected to server')
      this.connected = true
      this.socket.emit('join', user.id)
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
      this.connected = false
    })

    return this.socket
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  // Message events
  sendMessage(messageData) {
    if (this.socket) {
      this.socket.emit('sendMessage', messageData)
    }
  }

  onNewMessage(callback) {
    if (this.socket) {
      this.socket.on('newMessage', callback)
    }
  }

  // Typing events
  sendTyping(recipientId, isTyping) {
    if (this.socket) {
      this.socket.emit('typing', { recipientId, isTyping })
    }
  }

  onTyping(callback) {
    if (this.socket) {
      this.socket.on('typing', callback)
    }
  }

  // Notification events
  sendNotification(notification) {
    if (this.socket) {
      this.socket.emit('sendNotification', notification)
    }
  }

  onNotification(callback) {
    if (this.socket) {
      this.socket.on('notification', callback)
    }
  }

  // User status events
  onUserOnline(callback) {
    if (this.socket) {
      this.socket.on('userOnline', callback)
    }
  }

  onUserOffline(callback) {
    if (this.socket) {
      this.socket.on('userOffline', callback)
    }
  }
}

export default new SocketService()
