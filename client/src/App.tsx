import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './components/Dashboard'
import Community from './components/Community'
import Messages from './components/Messages'
import Login from './components/Login'
import Register from './components/Register'
import Profile from './components/Profile'
import PostList from './components/PostList'
import MyPosts from './components/MyPosts'
import CreatePost from './components/CreatePost'
import EditPost from './components/EditPost'
import EditProfile from './components/EditProfile'
import Search from './components/Search'
import UserProfile from './components/UserProfile'
import Chat from './components/Chat'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { user } = useAuth()

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
          />
          
          <Route 
            path="/dashboard" 
            element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/posts" 
            element={user ? <PostList /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/my-posts" 
            element={user ? <MyPosts /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/create-post" 
            element={user ? <CreatePost /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/edit-post/:id" 
            element={user ? <EditPost /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/messages" 
            element={user ? <Messages /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/chat/:id" 
            element={user ? <Chat /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/search" 
            element={user ? <Search /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/community" 
            element={user ? <Community /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/user-profile/:id" 
            element={user ? <UserProfile /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/profile" 
            element={user ? <Profile /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/edit-profile" 
            element={user ? <EditProfile /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />
          <Route 
            path="*" 
            element={<Navigate to={user ? "/dashboard" : "/login"} replace />} 
          />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
