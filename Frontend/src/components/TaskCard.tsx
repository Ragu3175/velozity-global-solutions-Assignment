import React, { useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  assignee: { name: string }
}

const statusOptions = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'OVERDUE']

const priorityColors: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#f97316',
  CRITICAL: '#ef4444'
}

const TaskCard = ({ task, onUpdate }: { task: Task, onUpdate: () => void }) => {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (status: string) => {
    if (loading) return
    setLoading(true)
    try {
      await api.patch(`/tasks/${task.id}/status`, { status })
      onUpdate()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'DONE'

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 12, background: 'white' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>{task.title}</h4>
        <span style={{ background: priorityColors[task.priority], color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 12 }}>
          {task.priority}
        </span>
      </div>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '8px 0' }}>{task.description}</p>
      <p style={{ fontSize: 12, color: isOverdue ? 'red' : '#6b7280' }}>
        Due: {new Date(task.dueDate).toLocaleDateString()} {isOverdue && '⚠️ Overdue'}
      </p>
      <p style={{ fontSize: 12 }}>Assigned to: {task.assignee?.name}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13 }}>Status:</span>
        <select
          value={task.status}
          onChange={e => handleStatusChange(e.target.value)}
          disabled={user?.role === 'ADMIN' || loading}
          style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ccc', opacity: loading ? 0.7 : 1 }}
        >
          {statusOptions.map(s => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default TaskCard