import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getIdTokenResult, onAuthStateChanged } from 'firebase/auth'
import Booking from './pages/Booking'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import { auth } from './config/firebase'

function App() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null)
        setIsAdmin(false)
        setAuthLoading(false)
        return
      }

      try {
        const tokenResult = await getIdTokenResult(currentUser, true)
        setUser(currentUser)
        setIsAdmin(tokenResult?.claims?.admin === true)
      } catch (error) {
        console.error('Error al validar rol admin:', error)
        setUser(currentUser)
        setIsAdmin(false)
      } finally {
        setAuthLoading(false)
      }
    })

    return () => unsubscribe()
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgBase text-textMuted">
        Verificando sesión...
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta principal para los clientes */}
        <Route path="/" element={<Booking />} />

        {/* Login del administrador */}
        <Route path="/login" element={user && isAdmin ? <Navigate to="/dashboard" replace /> : <Login />} />

        {/* Ruta privada para el administrador */}
        <Route path="/dashboard" element={user && isAdmin ? <Dashboard /> : <Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
