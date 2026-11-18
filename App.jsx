import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { supabase } from './supabase.js'
import Dashboard from './componentes/dashboard/index.jsx'
import Login from './componentes/login/index.jsx'
import Perfil from './componentes/perfil/index.jsx'
import Registro from './componentes/registro/index.jsx'

const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

function LoadingScreen() {
  return (
    <main className="container min-vh-100 d-flex align-items-center justify-content-center">
      <div className="text-center" role="status">
        <div className="spinner-border text-primary" aria-hidden="true" />
        <span className="visually-hidden">Cargando...</span>
      </div>
    </main>
  )
}

function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState('')
  const [role, setRole] = useState(null)
  const [roleError, setRoleError] = useState('')

  useEffect(() => {
    let active = true
    let receivedAuthEvent = false
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true
      if (!active) return
      setSession(nextSession)
      setLoading(false)
      setAuthError('')
    })

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!active) return
        if (error) setAuthError(error.message)
        if (!receivedAuthEvent) setSession(data.session)
        setLoading(false)
      })
      .catch((error) => {
        if (!active) return
        setAuthError(error.message)
        setLoading(false)
      })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) {
      setRole(null)
      setRoleError('')
      return
    }

    let active = true
    setRole(null)
    setRoleError('')

    supabase
      .from('usuario')
      .select('rol')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          setRoleError(error.message)
          return
        }
        setRole(data?.rol ?? null)
      })
      .catch((error) => {
        if (active) setRoleError(error.message)
      })

    return () => {
      active = false
    }
  }, [session?.user?.id])

  return (
    <AuthContext.Provider value={{ session, loading, authError, role, roleError }}>
      {children}
    </AuthContext.Provider>
  )
}

function PrivateRoute({ children }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return session ? children : <Navigate to="/login" replace />
}

function LoginRoute() {
  const { session, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return session ? <Navigate to="/perfil" replace /> : <Login />
}

function AppLayout({ children }) {
  const { session, role, roleError } = useAuth()
  const navigate = useNavigate()
  const [logoutError, setLogoutError] = useState('')

  async function handleSignOut() {
    setLogoutError('')
    const { error } = await supabase.auth.signOut()
    if (error) {
      setLogoutError(error.message)
      return
    }
    navigate('/login')
  }

  return (
    <>
      <nav className="navbar navbar-expand bg-white border-bottom">
        <div className="container">
          <Link className="navbar-brand fst-italic fw-bold fs-3" to="/perfil">
            Instagram
          </Link>
          <div className="d-flex align-items-center gap-2">
            {role === 'admin' && (
              <Link className="btn btn-outline-secondary btn-sm" to="/dashboard">
                Dashboard
              </Link>
            )}
            <Link className="btn btn-outline-primary btn-sm" to="/perfil">
              Perfil
            </Link>
            <button className="btn btn-outline-danger btn-sm" onClick={handleSignOut}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </nav>
      <main className="container py-4">
        {(roleError || logoutError) && (
          <div className="alert alert-danger" role="alert">
            {roleError || logoutError}
          </div>
        )}
        {children}
      </main>
    </>
  )
}

function AppRoutes() {
  const { authError, loading } = useAuth()
  if (loading) return <LoadingScreen />

  return (
    <>
      {authError && (
        <div className="container mt-3">
          <div className="alert alert-danger" role="alert">
            No se pudo recuperar la sesión: {authError}
          </div>
        </div>
      )}
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/registro" element={<Registro />} />
        <Route
          path="/perfil"
          element={
            <PrivateRoute>
              <AppLayout>
                <Perfil />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </PrivateRoute>
          }
        />
        <Route path="*" element={<Navigate to="/perfil" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
