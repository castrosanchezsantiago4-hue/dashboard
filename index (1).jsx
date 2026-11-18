import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase.js'

export default function Login() {
  const navigate = useNavigate()
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setEnviando(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    })
    setEnviando(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    navigate('/perfil')
  }

  return (
    <main className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card border rounded-3 shadow-sm">
            <div className="card-body p-4">
              <h1 className="text-center fst-italic fw-bold mb-4">Instagram</h1>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="login-correo">
                    Correo electrónico
                  </label>
                  <input
                    className="form-control"
                    id="login-correo"
                    type="email"
                    autoComplete="email"
                    value={correo}
                    onChange={(event) => setCorreo(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="login-password">
                    Contraseña
                  </label>
                  <input
                    className="form-control"
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                  />
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={enviando}>
                  {enviando ? 'Ingresando...' : 'Iniciar sesión'}
                </button>
              </form>
            </div>
          </div>
          <div className="card border rounded-3 mt-3">
            <div className="card-body text-center">
              ¿No tienes una cuenta? <Link to="/registro">Regístrate</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
