import axios from 'axios'
import { jwtDecode } from 'jwt-decode'

const api = axios.create({ baseURL: 'http://localhost:5000/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const register = (data) => api.post('/auth/register', data)
export const login = (data) => api.post('/auth/login', data)

export function getCurrentUser() {
  try {
    const token = localStorage.getItem('token')
    if (!token) return null
    
    // Check if token is expired
    const decoded = jwtDecode(token)
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token')
      return null
    }
    
    return decoded
  } catch {
    localStorage.removeItem('token')
    return null
  }
}

export default api
