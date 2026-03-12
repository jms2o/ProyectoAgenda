import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../config/firebase'

const getAuthErrorMessage = (code) => {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Correo o contraseña incorrectos.'
    case 'auth/invalid-email':
      return 'El formato del correo no es válido.'
    case 'auth/user-disabled':
      return 'Este usuario está deshabilitado en Firebase.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
    case 'auth/network-request-failed':
      return 'Error de red. Verifica tu conexión.'
    case 'auth/unauthorized-domain':
      return 'Dominio no autorizado. Agrega localhost en Firebase Authentication > Configuración.'
    case 'auth/operation-not-allowed':
      return 'Email/Password no está habilitado en Firebase Authentication.'
    case 'auth/invalid-api-key':
      return 'API key inválida. Revisa la configuración de Firebase del proyecto.'
    default:
      return `No se pudo iniciar sesión (${code || 'error-desconocido'}).`
  }
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      navigate('/dashboard', { replace: true })
    } catch (authError) {
      console.error('Error al iniciar sesión:', authError)
      setError(getAuthErrorMessage(authError?.code))
    } finally {
      setIsSubmitting(false)
    }
  }

  if (auth.currentUser) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-bgBase flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-surface border border-gray-100 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-primary mb-1">Acceso Administrador</h1>
        <p className="text-sm text-textMuted mb-6">Inicia sesión para entrar al dashboard.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-textMuted mb-1" htmlFor="email">
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full bg-bgBase border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="admin@empresa.com"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-textMuted mb-1" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full bg-bgBase border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-surface rounded-lg py-2.5 font-medium hover:bg-opacity-90 transition-all disabled:opacity-60"
          >
            {isSubmitting ? 'Ingresando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
