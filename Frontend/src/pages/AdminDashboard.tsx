import React, { useEffect, useState } from 'react'
import api from '../api/axios'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import ActivityFeed from '../components/ActivityFeed'
import socket from '../socket/socket'

interface Task {
  id: string
  title: string
  description: string
  status: string
  priority: string
  dueDate: string
  assignee: { name: string }
}

interface Project {
  id: string
  name: string
  tasks: Task[]
  manager?: { name: string }
}

const AdminDashboard = () => {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [onlineCount, setOnlineCount] = useState(0)
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [developers, setDevelopers] = useState<{ id: string, name: string }[]>([])
  const [clients, setClients] = useState<{ id: string, name: string }[]>([])
  const [managers, setManagers] = useState<{ id: string, name: string }[]>([])

  // Project modal
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [projectClientId, setProjectClientId] = useState('')
  const [projectManagerId, setProjectManagerId] = useState('')

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDesc, setTaskDesc] = useState('')
  const [taskAssignee, setTaskAssignee] = useState('')
  const [taskPriority, setTaskPriority] = useState('MEDIUM')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchProjects = async () => {
    const res = await api.get('/projects')
    setProjects(res.data)
    if (res.data.length > 0 && !selectedProject) setSelectedProject(res.data[0].id)
  }

  const fetchUsers = async () => {
    const res = await api.get('/tasks/users')
    setDevelopers(res.data.filter((u: any) => u.role === 'DEVELOPER'))
    setManagers(res.data.filter((u: any) => u.role === 'PM'))
  }

  const fetchClients = async () => {
    const res = await api.get('/tasks/clients')
    setClients(res.data)
  }

  useEffect(() => {
    fetchProjects()
    fetchUsers()
    fetchClients()

    socket.on('onlineCount', (count: number) => {
      setOnlineCount(count)
    })

    return () => { socket.off('onlineCount') }
  }, [])

  const createProject = async () => {
    if (!projectName || !projectClientId || !projectManagerId || loading) return
    setLoading(true)
    try {
      const res = await api.post('/projects', {
        name: projectName,
        description: projectDesc,
        clientId: projectClientId,
        managerId: projectManagerId
      })
      const newProject = res.data
      
      setShowProjectModal(false)
      setProjectName(''); setProjectDesc(''); setProjectClientId(''); setProjectManagerId('')
      
      setProjects(prev => [...prev, { ...newProject, tasks: [] }])
      setSelectedProject(newProject.id)
    } catch (err) {
      console.error('Failed to create project:', err)
    } finally {
      setLoading(false)
    }
  }

  const createTask = async () => {
    if (!taskTitle || !taskAssignee || !taskDueDate || loading) return
    setLoading(true)
    try {
      await api.post('/tasks', {
        title: taskTitle,
        description: taskDesc,
        assigneeId: taskAssignee,
        priority: taskPriority,
        dueDate: taskDueDate,
        projectId: selectedProject
      })
      setShowTaskModal(false)
      setTaskTitle(''); setTaskDesc(''); setTaskAssignee(''); setTaskDueDate('')
      fetchProjects()
    } catch (err) {
      console.error('Failed to create task:', err)
    } finally {
      setLoading(false)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Delete this project?')) return
    await api.delete(`/projects/${projectId}`)
    setSelectedProject('')
    fetchProjects()
  }

  const allTasks = projects.flatMap(p => p.tasks)
  const selectedTasks = projects
    .find(p => p.id === selectedProject)?.tasks
    .filter(t => {
      if (status && t.status !== status) return false
      if (priority && t.priority !== priority) return false
      return true
    }) || []

  const totalProjects = projects.length
  const totalTasks = allTasks.length
  const overdueTasks = allTasks.filter(t => t.status === 'OVERDUE').length

  const inputStyle: React.CSSProperties = {
    display: 'block', width: '100%', padding: 8,
    marginBottom: 12, border: '1px solid #ccc', borderRadius: 4
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar />
      <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Admin Dashboard</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowProjectModal(true)} style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              + New Project
            </button>
            <button onClick={() => setShowTaskModal(true)} disabled={!selectedProject} style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              + New Task
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Total Projects', value: totalProjects, color: '#4f46e5' },
            { label: 'Total Tasks', value: totalTasks, color: '#0ea5e9' },
            { label: 'Overdue', value: overdueTasks, color: '#ef4444' },
            { label: 'Online Users', value: onlineCount, color: '#22c55e' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', padding: 16, borderRadius: 8, border: '1px solid #e5e7eb' }}>
              <h4 style={{ margin: 0, color: '#6b7280' }}>{stat.label}</h4>
              <p style={{ fontSize: 32, margin: 0, color: stat.color }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Project selector */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
            style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc' }}>
            <option value="">Select a Project</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>
                {p.name} {p.manager?.name ? `(PM: ${p.manager.name})` : ''}
              </option>
            ))}
          </select>
          {selectedProject && (
            <button onClick={() => deleteProject(selectedProject)}
              style={{ padding: '6px 14px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
              Delete Project
            </button>
          )}
        </div>

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
            {selectedTasks.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, background: 'white', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                <p style={{ color: '#6b7280', marginBottom: 16 }}>No tasks in this project yet.</p>
                <button onClick={() => setShowTaskModal(true)} style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  Create First Task
                </button>
              </div>
            )}
            {selectedTasks.map(task => (
              <TaskCard key={task.id} task={task} onUpdate={fetchProjects} />
            ))}
          </div>
          <ActivityFeed projectId={selectedProject} />
        </div>
      </div>

      {/* Project Modal */}
      {showProjectModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 8, width: 400 }}>
            <h3>Create Project</h3>
            <input placeholder="Project name" value={projectName} onChange={e => setProjectName(e.target.value)} style={inputStyle} />
            <input placeholder="Description" value={projectDesc} onChange={e => setProjectDesc(e.target.value)} style={inputStyle} />
            <select value={projectClientId} onChange={e => setProjectClientId(e.target.value)} style={inputStyle}>
              <option value="">Select Client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={projectManagerId} onChange={e => setProjectManagerId(e.target.value)} style={inputStyle}>
              <option value="">Select PM</option>
              {managers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowProjectModal(false)} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createProject} disabled={loading} style={{ padding: '8px 16px', background: '#4f46e5', color: 'white', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 8, width: 400 }}>
            <h3>Create Task</h3>
            <input placeholder="Task title" value={taskTitle} onChange={e => setTaskTitle(e.target.value)} style={inputStyle} />
            <input placeholder="Description" value={taskDesc} onChange={e => setTaskDesc(e.target.value)} style={inputStyle} />
            <select value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} style={inputStyle}>
              <option value="">Assign Developer</option>
              {developers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select value={taskPriority} onChange={e => setTaskPriority(e.target.value)} style={inputStyle}>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} style={inputStyle} />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowTaskModal(false)} disabled={loading} style={{ padding: '8px 16px', cursor: 'pointer' }}>Cancel</button>
              <button onClick={createTask} disabled={loading} style={{ padding: '8px 16px', background: '#0ea5e9', color: 'white', border: 'none', borderRadius: 4, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard