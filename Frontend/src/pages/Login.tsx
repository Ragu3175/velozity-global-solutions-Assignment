import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'
import socket from '../socket/socket'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async () => {
    try {
      const res = await api.post('/auth/login', { email, password })
      const { accessToken, user } = res.data

      login(accessToken, user)

      // Connect socket after login
      socket.auth = { token: accessToken }
      socket.connect()

      // Redirect based on role
      if (user.role === 'ADMIN') navigate('/admin')
      else if (user.role === 'PM') navigate('/pm')
      else navigate('/dev')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div style={{ width: 350, padding: 32, border: '1px solid #ccc', borderRadius: 8 }}>
        <h2>Velozity Dashboard</h2>
        <p>Login to continue</p>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div style={{ marginBottom: 16 }}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', padding: 8, marginTop: 4 }}
          />
        </div>
        <button
          onClick={handleLogin}
          style={{ width: '100%', padding: 10, background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Login
        </button>
      </div>
    </div>
  )
}

export default Login