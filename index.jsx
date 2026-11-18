import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../App.jsx'
import { supabase } from '../../supabase.js'

function MetricCard({ label, value }) {
  return (
    <div className="col">
      <div className="card h-100">
        <div className="card-body">
          <p className="text-secondary mb-1">{label}</p>
          <p className="h3 mb-0">{value}</p>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [usuarios, setUsuarios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [cargando, setCargando] = useState(true)
  const [autorizado, setAutorizado] = useState(false)
  const [error, setError] = useState('')
  const [guardandoId, setGuardandoId] = useState(null)
  const [borrandoPublicacionId, setBorrandoPublicacionId] = useState(null)
  const [borradores, setBorradores] = useState({})

  useEffect(() => {
    let active = true

    async function cargarDashboard() {
      setCargando(true)
      setError('')
      setAutorizado(false)
      const { data, error: queryError } = await supabase
        .from('usuario')
        .select('id, nombre, correo, telefono, rol, creado_en, multimedia(id, url)')
        .order('creado_en', { ascending: false })

      if (!active) return
      if (queryError) {
        setError(queryError.message)
        setCargando(false)
        return
      }

      const filas = data ?? []
      setUsuarios(filas)
      const usuarioActual = filas.find((usuario) => usuario.id === session.user.id)
      if (usuarioActual?.rol !== 'admin') {
        setCargando(false)
        navigate('/perfil', { replace: true })
        return
      }

      setAutorizado(true)
      setCargando(false)
    }

    cargarDashboard()
    return () => {
      active = false
    }
  }, [navigate, session.user.id])

  const usuariosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLocaleLowerCase()
    if (!termino) return usuarios
    return usuarios.filter((usuario) =>
      `${usuario.nombre ?? ''} ${usuario.correo ?? ''}`.toLocaleLowerCase().includes(termino)
    )
  }, [busqueda, usuarios])

  const totalUsuarios = usuarios.length
  const totalAdministradores = usuarios.filter((usuario) => usuario.rol === 'admin').length
  const totalPublicaciones = usuarios.reduce(
    (total, usuario) => total + (usuario.multimedia?.length ?? 0),
    0
  )
  const limiteNuevos = Date.now() - 7 * 24 * 60 * 60 * 1000
  const nuevosEnSieteDias = usuarios.filter(
    (usuario) => usuario.creado_en && new Date(usuario.creado_en).getTime() >= limiteNuevos
  ).length

  const barras = [
    { etiqueta: 'Usuarios', valor: totalUsuarios },
    { etiqueta: 'Administradores', valor: totalAdministradores },
    { etiqueta: 'Publicaciones', valor: totalPublicaciones },
    { etiqueta: 'Nuevos en 7 días', valor: nuevosEnSieteDias },
  ]
  const maximoBarra = Math.max(...barras.map((barra) => barra.valor), 1)

  function cambiarBorrador(usuario, campo, valor) {
    setBorradores((actuales) => ({
      ...actuales,
      [usuario.id]: {
        nombre: actuales[usuario.id]?.nombre ?? usuario.nombre ?? '',
        telefono: actuales[usuario.id]?.telefono ?? usuario.telefono ?? '',
        [campo]: valor,
      },
    }))
  }

  async function guardarUsuario(usuario) {
    setError('')
    setGuardandoId(usuario.id)
    const borrador = borradores[usuario.id] ?? {
      nombre: usuario.nombre ?? '',
      telefono: usuario.telefono ?? '',
    }
    const { error: updateError } = await supabase
      .from('usuario')
      .update({
        nombre: borrador.nombre.trim(),
        telefono: borrador.telefono.trim(),
      })
      .eq('id', usuario.id)
    setGuardandoId(null)

    if (updateError) {
      setError(`No se pudo guardar a ${usuario.nombre || usuario.correo}: ${updateError.message}`)
      return
    }
    setUsuarios((actuales) =>
      actuales.map((fila) =>
        fila.id === usuario.id
          ? { ...fila, nombre: borrador.nombre.trim(), telefono: borrador.telefono.trim() }
          : fila
      )
    )
    setBorradores((actuales) => {
      const { [usuario.id]: _guardado, ...restantes } = actuales
      return restantes
    })
  }

  async function eliminarPublicacion(usuarioId, publicacion) {
    if (!window.confirm('¿Eliminar esta publicación?')) return
    setError('')
    setBorrandoPublicacionId(publicacion.id)
    const { error: deleteError } = await supabase
      .from('multimedia')
      .delete()
      .eq('id', publicacion.id)
      .eq('usuario_id', usuarioId)
    setBorrandoPublicacionId(null)

    if (deleteError) {
      setError(`No se pudo eliminar la publicación: ${deleteError.message}`)
      return
    }
    setUsuarios((actuales) =>
      actuales.map((usuario) =>
        usuario.id === usuarioId
          ? {
              ...usuario,
              multimedia: (usuario.multimedia ?? []).filter((item) => item.id !== publicacion.id),
            }
          : usuario
      )
    )
  }

  if (cargando || !autorizado) {
    return (
      <div className="text-center py-5" role="status">
        <div className="spinner-border text-primary" aria-hidden="true" />
        <span className="visually-hidden">Cargando panel de moderación...</span>
        {error && <div className="alert alert-danger mt-3">{error}</div>}
      </div>
    )
  }

  return (
    <section>
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-4">
        <div>
          <h1 className="h2 fst-italic fw-bold mb-1">Panel de moderación</h1>
          <p className="text-secondary mb-0">Resumen y administración de la comunidad.</p>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="row row-cols-1 row-cols-sm-2 row-cols-xl-4 g-3 mb-4">
        <MetricCard label="Usuarios" value={totalUsuarios} />
        <MetricCard label="Administradores" value={totalAdministradores} />
        <MetricCard label="Publicaciones" value={totalPublicaciones} />
        <MetricCard label="Nuevos en 7 días" value={nuevosEnSieteDias} />
      </div>

      <div className="card mb-4">
        <div className="card-body">
          <h2 className="h5 mb-3">Actividad de la comunidad</h2>
          {barras.map((barra) => (
            <div className="mb-3" key={barra.etiqueta}>
              <div className="d-flex justify-content-between mb-1">
                <span>{barra.etiqueta}</span>
                <span>{barra.valor}</span>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-label={barra.etiqueta}
                aria-valuenow={barra.valor}
                aria-valuemin="0"
                aria-valuemax={maximoBarra}
              >
                <div
                  className="progress-bar"
                  style={{ width: `${(barra.valor / maximoBarra) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <h2 className="h4 mb-0">Usuarios y publicaciones</h2>
        <div className="flex-grow-1">
          <label className="visually-hidden" htmlFor="buscar-usuarios">
            Buscar por nombre o correo
          </label>
          <input
            className="form-control"
            id="buscar-usuarios"
            type="search"
            placeholder="Buscar por nombre o correo"
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
          />
        </div>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover align-middle">
          <thead>
            <tr>
              <th scope="col">Nombre</th>
              <th scope="col">Correo</th>
              <th scope="col">Teléfono</th>
              <th scope="col">Rol</th>
              <th scope="col">Alta</th>
              <th scope="col">Publicaciones</th>
              <th scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((usuario) => {
              const borrador = borradores[usuario.id] ?? {
                nombre: usuario.nombre ?? '',
                telefono: usuario.telefono ?? '',
              }
              return (
                <tr key={usuario.id}>
                  <td>
                    <input
                      className="form-control form-control-sm"
                      aria-label={`Nombre de ${usuario.correo}`}
                      value={borrador.nombre}
                      onChange={(event) =>
                        cambiarBorrador(usuario, 'nombre', event.target.value)
                      }
                    />
                  </td>
                  <td>{usuario.correo}</td>
                  <td>
                    <input
                      className="form-control form-control-sm"
                      aria-label={`Teléfono de ${usuario.correo}`}
                      value={borrador.telefono}
                      onChange={(event) =>
                        cambiarBorrador(usuario, 'telefono', event.target.value)
                      }
                    />
                  </td>
                  <td>{usuario.rol}</td>
                  <td>
                    {usuario.creado_en
                      ? new Date(usuario.creado_en).toLocaleDateString('es')
                      : '—'}
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      {(usuario.multimedia ?? []).map((publicacion) => (
                        <button
                          className="btn p-0 border-0"
                          type="button"
                          key={publicacion.id}
                          aria-label={`Borrar publicación de ${usuario.nombre || usuario.correo}`}
                          title="Borrar publicación"
                          disabled={borrandoPublicacionId === publicacion.id}
                          onClick={() => eliminarPublicacion(usuario.id, publicacion)}
                        >
                          <img
                            className="img-thumbnail object-fit-cover"
                            src={publicacion.url}
                            alt=""
                            width="48"
                            height="48"
                          />
                        </button>
                      ))}
                      {(usuario.multimedia ?? []).length === 0 && (
                        <span className="text-secondary">0</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="d-flex flex-wrap gap-1">
                      <button
                        className="btn btn-primary btn-sm"
                        type="button"
                        disabled={guardandoId === usuario.id}
                        onClick={() => guardarUsuario(usuario)}
                      >
                        {guardandoId === usuario.id ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {usuariosFiltrados.length === 0 && (
              <tr>
                <td className="text-center text-secondary py-4" colSpan="7">
                  No se encontraron usuarios.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
