import { useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import ActivityFeed from '../components/ActivityFeed'

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  assignee: { name: string }
}

const DevDashboard = () => {
  const [tasks, setTasks] = useState<Task[]>([])
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')

  const fetchTasks = async () => {
    const params: any = {}
    if (status) params.status = status
    if (priority) params.priority = priority
    const res = await api.get('/tasks', { params })
    setTasks(res.data)
  }

  useEffect(() => {
    fetchTasks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, priority])

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar />
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <h2>My Tasks</h2>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc' }}>
            <option value="">All Status</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="DONE">Done</option>
            <option value="OVERDUE">Overdue</option>
          </select>
          <select value={priority} onChange={e => setPriority(e.target.value)} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc' }}>
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            {tasks.length === 0 && <p>No tasks found</p>}
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} onUpdate={fetchTasks} />
            ))}
          </div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  )
}

export default DevDashboard