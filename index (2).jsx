import { useEffect, useState } from 'react'
import { useAuth } from '../../App.jsx'
import { supabase } from '../../supabase.js'

export default function Perfil() {
  const { session } = useAuth()
  const userId = session.user.id
  const [perfil, setPerfil] = useState(null)
  const [publicaciones, setPublicaciones] = useState([])
  const [cargando, setCargando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [telefono, setTelefono] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let active = true

    async function cargarPerfil() {
      setCargando(true)
      setError('')
      const [perfilResult, publicacionesResult] = await Promise.all([
        supabase
          .from('usuario')
          .select('id, nombre, correo, fecha_nacimiento, telefono')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('multimedia')
          .select('id, url, creado_en')
          .eq('usuario_id', userId)
          .order('creado_en', { ascending: false }),
      ])
      if (!active) return

      if (perfilResult.error) {
        setError(perfilResult.error.message)
      } else if (!perfilResult.data) {
        setError('No se encontró el perfil de este usuario.')
      } else {
        const data = perfilResult.data
        setPerfil(data)
        setNombre(data.nombre ?? '')
        setFechaNacimiento(data.fecha_nacimiento ?? '')
        setTelefono(data.telefono ?? '')
      }

      if (publicacionesResult.error) {
        setError((current) =>
          current
            ? `${current} No se pudieron cargar las publicaciones: ${publicacionesResult.error.message}`
            : `No se pudieron cargar las publicaciones: ${publicacionesResult.error.message}`
        )
      } else {
        setPublicaciones(publicacionesResult.data ?? [])
      }
      setCargando(false)
    }

    cargarPerfil()
    return () => {
      active = false
    }
  }, [userId])

  async function handleGuardarPerfil(event) {
    event.preventDefault()
    setError('')
    setMensaje('')
    setGuardando(true)
    const { data, error: updateError } = await supabase
      .from('usuario')
      .update({
        nombre: nombre.trim(),
        fecha_nacimiento: fechaNacimiento || null,
        telefono: telefono.trim(),
      })
      .eq('id', userId)
      .select('id, nombre, correo, fecha_nacimiento, telefono')
      .single()
    setGuardando(false)

    if (updateError) {
      setError(updateError.message)
      return
    }
    setPerfil(data)
    setMensaje('Perfil actualizado.')
    setEditando(false)
  }

  async function handleAgregarPublicacion(event) {
    event.preventDefault()
    setError('')
    setMensaje('')
    setGuardando(true)
    const { data, error: insertError } = await supabase
      .from('multimedia')
      .insert({ usuario_id: userId, url: url.trim() })
      .select('id, url, creado_en')
      .single()
    setGuardando(false)

    if (insertError) {
      setError(insertError.message)
      return
    }
    setPublicaciones((current) => [data, ...current])
    setUrl('')
  }

  async function handleEliminarPublicacion(publicacionId) {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    setError('')
    const { error: deleteError } = await supabase
      .from('multimedia')
      .delete()
      .eq('id', publicacionId)
      .eq('usuario_id', userId)

    if (deleteError) {
      setError(deleteError.message)
      return
    }
    setPublicaciones((current) =>
      current.filter((publicacion) => publicacion.id !== publicacionId)
    )
  }

  if (cargando) {
    return (
      <div className="text-center py-5" role="status">
        <div className="spinner-border text-primary" aria-hidden="true" />
        <span className="visually-hidden">Cargando perfil...</span>
      </div>
    )
  }

  return (
    <section>
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
      {perfil && (
        <>
          <div className="row justify-content-center mb-4">
            <div className="col-12 col-lg-8">
              <div className="row align-items-center g-3 py-3">
                <div className="col-3 col-sm-2">
                  <div className="ratio ratio-1x1 rounded-circle overflow-hidden">
                    <div
                      className="text-bg-secondary d-flex align-items-center justify-content-center fs-2"
                      aria-label={`Avatar de ${perfil.nombre || 'usuario'}`}
                    >
                      {(perfil.nombre || '?').trim().charAt(0).toUpperCase()}
                    </div>
                  </div>
                </div>
                <div className="col">
                  <h1 className="h3 mb-2">{perfil.nombre || 'Usuario'}</h1>
                  <p className="mb-2">
                    <strong>{publicaciones.length}</strong>{' '}
                    {publicaciones.length === 1 ? 'publicación' : 'publicaciones'}
                  </p>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    type="button"
                    onClick={() => setEditando((current) => !current)}
                  >
                    {editando ? 'Cancelar edición' : 'Editar perfil'}
                  </button>
                </div>
              </div>

              {editando && (
                <form className="card card-body mb-4" onSubmit={handleGuardarPerfil}>
                  <h2 className="h5">Editar perfil</h2>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="perfil-nombre">
                      Nombre
                    </label>
                    <input
                      className="form-control"
                      id="perfil-nombre"
                      value={nombre}
                      onChange={(event) => setNombre(event.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="perfil-fecha-nacimiento">
                      Fecha de nacimiento
                    </label>
                    <input
                      className="form-control"
                      id="perfil-fecha-nacimiento"
                      type="date"
                      value={fechaNacimiento}
                      onChange={(event) => setFechaNacimiento(event.target.value)}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label" htmlFor="perfil-telefono">
                      Teléfono
                    </label>
                    <input
                      className="form-control"
                      id="perfil-telefono"
                      type="tel"
                      value={telefono}
                      onChange={(event) => setTelefono(event.target.value)}
                    />
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={guardando}>
                    {guardando ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </form>
              )}

              <form className="card card-body mb-4" onSubmit={handleAgregarPublicacion}>
                <label className="form-label" htmlFor="publicacion-url">
                  Agregar publicación (URL de imagen)
                </label>
                <div className="input-group">
                  <input
                    className="form-control"
                    id="publicacion-url"
                    type="url"
                    placeholder="https://..."
                    value={url}
                    onChange={(event) => setUrl(event.target.value)}
                    required
                  />
                  <button className="btn btn-primary" type="submit" disabled={guardando}>
                    Agregar
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-12 col-lg-8">
              <h2 className="h5 border-top pt-3 mb-3">Publicaciones</h2>
              {publicaciones.length === 0 ? (
                <p className="text-secondary text-center py-4">
                  Todavía no hay publicaciones.
                </p>
              ) : (
                <div className="row row-cols-3 g-1">
                  {publicaciones.map((publicacion) => (
                    <div className="col" key={publicacion.id}>
                      <div className="ratio ratio-1x1 position-relative">
                        <img
                          className="w-100 h-100 object-fit-cover"
                          src={publicacion.url}
                          alt={`Publicación de ${perfil.nombre || 'usuario'}`}
                        />
                        <button
                          className="btn btn-danger btn-sm position-absolute top-0 end-0 m-1"
                          type="button"
                          aria-label="Borrar publicación"
                          onClick={() => handleEliminarPublicacion(publicacion.id)}
                        >
                          Borrar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
