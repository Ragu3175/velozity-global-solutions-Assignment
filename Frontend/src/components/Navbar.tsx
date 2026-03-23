import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import socket from '../socket/socket'
import NotificationBell from './NotificationBell'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await api.post('/auth/logout')
    socket.disconnect()
    logout()
    navigate('/login')
  }

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#4f46e5', color: 'white' }}>
      <h2 style={{ margin: 0 }}>Velozity Dashboard</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span>{user?.name} ({user?.role})</span>
        <NotificationBell />
        <button
          onClick={handleLogout}
          style={{ padding: '6px 16px', background: 'white', color: '#4f46e5', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
    </nav>
  )
}

export default Navbar