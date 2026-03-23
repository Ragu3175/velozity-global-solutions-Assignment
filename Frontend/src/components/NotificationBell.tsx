import { useState, useEffect, useRef } from 'react'
import api from '../api/axios'
import socket from '../socket/socket'

interface Notification {
  id: string
  message: string
  read: boolean
  createdAt: string
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    const res = await api.get('/notifications')
    setNotifications(res.data)
  }

  useEffect(() => {
    fetchNotifications()

    const onNotification = (data: Notification) => {
      setNotifications(prev => [data, ...prev])
    }
    socket.on('notification', onNotification)
    return () => { socket.off('notification', onNotification) }
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const unread = notifications.filter(n => !n.read).length

  const markOne = async (id: string) => {
    await api.patch(`/notifications/${id}/read`)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAll = async () => {
    await api.patch('/notifications/read-all')
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'white', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        🔔
        {unread > 0 && (
          <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', padding: '2px 7px', fontSize: 11, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 42, width: 340,
          background: 'white', border: '1px solid #e5e7eb', borderRadius: 10,
          zIndex: 1000, maxHeight: 420, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 16px', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, background: 'white'
          }}>
            <strong style={{ color: '#111827', fontSize: 15 }}>Notifications</strong>
            <button
              onClick={markAll}
              style={{
                fontSize: 12, cursor: 'pointer',
                background: '#4f46e5', color: 'white',
                border: 'none', borderRadius: 6,
                padding: '4px 10px', fontWeight: 600
              }}
            >
              Mark all read
            </button>
          </div>

          {notifications.length === 0 && (
            <p style={{ padding: 16, color: '#6b7280', margin: 0 }}>No notifications</p>
          )}

          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => markOne(n.id)}
              style={{
                padding: '10px 16px',
                background: n.read ? 'white' : '#eef2ff',
                cursor: 'pointer',
                borderBottom: '1px solid #f0f0f0',
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}
            >
              <p style={{ margin: 0, fontSize: 14, color: '#111827', fontWeight: n.read ? 400 : 600 }}>
                {n.message}
              </p>
              <small style={{ color: '#6b7280', fontSize: 11 }}>
                {new Date(n.createdAt).toLocaleString()}
              </small>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default NotificationBell