import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import PMDashboard from './pages/PMDashboard'
import DevDashboard from './pages/DevDashboard'

const ProtectedRoute = ({ children, role }: { children: React.ReactElement, role: string }) => {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" />
  if (user.role !== role) return <Navigate to="/login" />
  return children
}

const AppRoutes = () => {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={
        <ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/pm" element={
        <ProtectedRoute role="PM"><PMDashboard /></ProtectedRoute>
      } />
      <Route path="/dev" element={
        <ProtectedRoute role="DEVELOPER"><DevDashboard /></ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to={user ? `/${user.role.toLowerCase()}` : '/login'} />} />
    </Routes>
  )
}

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App