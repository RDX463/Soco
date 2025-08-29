import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { fetchUsers, createUser, updateUser, deleteUser } from '../api'
import { getCurrentUser } from '../services/auth'
import { useAuth } from '../contexts/AuthContext'

export default function UserList() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ name: '', email: '' })
  const [editingId, setEditingId] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()
  const user = getCurrentUser()
  const logout = useAuth()

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await fetchUsers()
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      await createUser(form)
      setForm({ name: '', email: '' })
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(id) {
    setLoading(true)
    try {
      await updateUser(id, form)
      setEditingId(null)
      setForm({ name: '', email: '' })
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id) {
    setLoading(true)
    try {
      await deleteUser(id)
      await load()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login', { replace: true })
    window.location.reload()
    logout()
  }

  return (
    <div className="max-w-lg mx-auto p-4 bg-white rounded shadow">
      {/* Combined navigation with conditional rendering based on auth */}
      <nav className="flex justify-between mb-6">
        {user ? (
          <>
            <Link to="/" className="text-blue-600 hover:underline">Users</Link>
            <Link to="/profile" className="text-blue-600 hover:underline">Profile</Link>
            <button onClick={handleLogout} className="text-red-600 hover:underline">Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-blue-600 hover:underline">Login</Link>
            <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
          </>
        )}
        <div className="space-x-4">
          <Link to="/posts" className="text-blue-600 hover:underline">Posts</Link>
          <Link to="/users" className="text-blue-600 hover:underline">Users</Link>
          <Link to="/profile" className="text-blue-600 hover:underline">Profile</Link>
        </div>
  <button onClick={handleLogout} className="text-red-600 hover:underline">
    Logout
  </button>
      </nav>

      <h2 className="text-xl font-bold mb-4">User Management</h2>

      <form onSubmit={handleSubmit} className="mb-6 space-y-2">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={e => setForm({ ...form, email: e.target.value })}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? 'Adding...' : 'Add User'}
        </button>
      </form>

      <ul className="space-y-4">
        {users.map(u => (
          <li key={u._id} className="flex justify-between items-center">
            {editingId === u._id ? (
              <div className="flex-1 space-x-2">
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="border px-2 py-1 rounded"
                />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="border px-2 py-1 rounded"
                />
                <button
                  onClick={() => handleSave(u._id)}
                  disabled={loading}
                  className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingId(null)
                    setForm({ name: '', email: '' })
                  }}
                  className="px-3 py-1"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex-1 flex justify-between items-center">
                <span>
                  <strong>{u.name}</strong> — {u.email}
                </span>
                <div className="space-x-2">
                  <button
                    onClick={() => {
                      setEditingId(u._id)
                      setForm({ name: u.name, email: u.email })
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(u._id)}
                    disabled={loading}
                    className="text-red-600 hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
