import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../../supabase.js'

export default function Registro() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setMensaje('')
    setEnviando(true)
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: correo,
      password,
      options: {
        data: {
          nombre,
          fecha_nacimiento: fechaNacimiento,
          telefono,
        },
      },
    })
    setEnviando(false)

    if (signUpError) {
      setError(signUpError.message)
      return
    }
    if (data.session) {
      navigate('/perfil')
      return
    }
    setMensaje('Revisa tu correo para confirmar la cuenta y luego inicia sesión.')
  }

  return (
    <main className="container min-vh-100 d-flex align-items-center justify-content-center py-5">
      <div className="row justify-content-center w-100">
        <div className="col-12 col-sm-8 col-md-6 col-lg-4">
          <div className="card border rounded-3 shadow-sm">
            <div className="card-body p-4">
              <h1 className="text-center fst-italic fw-bold mb-2">Instagram</h1>
              <p className="text-center text-secondary mb-4">
                Regístrate para compartir tus fotos.
              </p>
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              {mensaje && (
                <div className="alert alert-success" role="status">
                  {mensaje}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" htmlFor="registro-nombre">
                    Nombre
                  </label>
                  <input
                    className="form-control"
                    id="registro-nombre"
                    autoComplete="name"
                    value={nombre}
                    onChange={(event) => setNombre(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="registro-correo">
                    Correo electrónico
                  </label>
                  <input
                    className="form-control"
                    id="registro-correo"
                    type="email"
                    autoComplete="email"
                    value={correo}
                    onChange={(event) => setCorreo(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="registro-fecha">
                    Fecha de nacimiento
                  </label>
                  <input
                    className="form-control"
                    id="registro-fecha"
                    type="date"
                    value={fechaNacimiento}
                    onChange={(event) => setFechaNacimiento(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="registro-telefono">
                    Teléfono
                  </label>
                  <input
                    className="form-control"
                    id="registro-telefono"
                    type="tel"
                    autoComplete="tel"
                    value={telefono}
                    onChange={(event) => setTelefono(event.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label" htmlFor="registro-password">
                    Contraseña
                  </label>
                  <input
                    className="form-control"
                    id="registro-password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <button className="btn btn-primary w-100" type="submit" disabled={enviando}>
                  {enviando ? 'Creando cuenta...' : 'Registrarte'}
                </button>
              </form>
            </div>
          </div>
          <div className="card border rounded-3 mt-3">
            <div className="card-body text-center">
              ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
