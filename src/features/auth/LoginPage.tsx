import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { Button } from '../../components/ui/Button'
import { useAuth } from './AuthContext'
import type { Role } from '../../types/domain'
import { roleLabels } from '../../data/demo'

export function LoginPage() {
  const [role, setRole] = useState<Role>('admin')
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    login(role)
    navigate(role === 'participant' ? '/app' : role === 'mentor' ? '/mentor' : role === 'evaluator' ? '/evaluador' : '/admin')
  }

  return (
    <main className="auth-page">
      <section className="auth-art">
        <Brand />
        <div className="auth-quote">
          <span className="eyebrow">Navega. Conecta. Avanza.</span>
          <h1>Transformamos seguimiento en impulso.</h1>
          <p>Un espacio compartido para que equipos, mentores y coordinación trabajen con la misma información y una meta clara.</p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">Acceso seguro</span>
          <h1>Bienvenido de nuevo</h1>
          <p className="muted">Accede al espacio de tu programa.</p>
          <div className="notice">Modo demostración: selecciona un perfil. Con Supabase configurado, este formulario usa autenticación real.</div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label htmlFor="email">Correo electrónico</label><input className="field" id="email" type="email" defaultValue="admin@odissea.local" required /></div>
            <div className="form-group"><label htmlFor="password">Contraseña</label><input className="field" id="password" type="password" defaultValue="odissea-demo" required /></div>
            <div>
              <span className="field-label">Perfil de demostración</span>
              <div className="demo-roles">
                {(Object.keys(roleLabels) as Role[]).map((item) => <button type="button" key={item} className={`demo-role ${role === item ? 'active' : ''}`} onClick={() => setRole(item)}>{roleLabels[item]}</button>)}
              </div>
            </div>
            <Button type="submit" icon={<ArrowRight size={17} />}>Entrar en ODISSEA HUB</Button>
            <Link to="/recuperar-contrasena" className="muted" style={{ textAlign: 'center', fontSize: '.75rem' }}>He olvidado mi contraseña</Link>
          </form>
        </div>
      </section>
    </main>
  )
}
