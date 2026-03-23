import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import socket from '../socket/socket'

interface ActivityLog {
  id: string
  message: string
  createdAt: string
  projectId?: string
  user: { name: string }
}

const ActivityFeed = ({ projectId }: { projectId?: string }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([])

  // Fetch logs over HTTP on mount / when projectId changes
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const url = projectId ? `/tasks/project/${projectId}/activity` : '/tasks/activity'
        const res = await api.get(url)
        setLogs(res.data)
      } catch {
        // ignore – socket missedEvents will fill in
      }
    }
    fetchLogs()
  }, [projectId])

  useEffect(() => {
    const onMissed = (data: ActivityLog[]) => {
      const filtered = projectId ? data.filter(l => l.projectId === projectId) : data
      setLogs(filtered)
    }

    const onActivity = (log: ActivityLog) => {
      if (projectId && log.projectId !== projectId) return
      setLogs(prev => [log, ...prev].slice(0, 20))
    }

    socket.on('missedEvents', onMissed)
    socket.on('activityUpdate', onActivity)

    return () => {
      socket.off('missedEvents', onMissed)
      socket.off('activityUpdate', onActivity)
    }
  }, [projectId])

  const timeAgo = (date: string) => {
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: 'white' }}>
      <h3 style={{ margin: '0 0 12px', color: '#111827' }}>Activity Feed</h3>
      {logs.length === 0 && <p style={{ color: '#9ca3af' }}>No activity yet</p>}
      {logs.map(log => (
        <div key={log.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
          <p style={{ margin: 0, fontSize: 14, color: '#374151', lineHeight: '1.4' }}>{log.message}</p>
          <small style={{ color: '#6b7280', fontSize: 11 }}>
            {log.user?.name || 'User'} · {timeAgo(log.createdAt)}
          </small>
        </div>
      ))}
    </div>
  )
}

export default ActivityFeed