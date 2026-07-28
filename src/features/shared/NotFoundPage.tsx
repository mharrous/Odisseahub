import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'

export function NotFoundPage({ unauthorized = false }: { unauthorized?: boolean }) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f5f7fa' }}>
      <section className="card" style={{ maxWidth: 520, textAlign: 'center' }}>
        <span className="eyebrow">{unauthorized ? 'Acceso protegido' : 'Ruta no encontrada'}</span>
        <h1 style={{ marginTop: 10 }}>{unauthorized ? 'No tienes permiso para entrar aquí' : 'Esta ruta no existe'}</h1>
        <p className="muted">{unauthorized ? 'La interfaz y la base de datos protegen la información según tu rol y organización.' : 'Comprueba la dirección o vuelve al inicio.'}</p>
        <Link to="/login"><Button>Volver a un espacio seguro</Button></Link>
      </section>
    </main>
  )
}
