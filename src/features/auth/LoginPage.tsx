import { useEffect, useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { Button } from '../../components/ui/Button'
import { useAuth } from './AuthContext'
import type { Role } from '../../types/domain'
import { roleLabels } from '../../data/demo'
import { isSupabaseConfigured } from '../../lib/supabase'

export function LoginPage() {
  const [role, setRole] = useState<Role>('admin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { login, loading, role: authenticatedRole } = useAuth()

  useEffect(() => {
    if (!loading && authenticatedRole) {
      navigate(authenticatedRole === 'participant' ? '/app' : authenticatedRole === 'mentor' ? '/mentor' : authenticatedRole === 'evaluator' ? '/evaluador' : '/admin', { replace: true })
    }
  }, [authenticatedRole, loading, navigate])

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    try {
      const authenticatedRole = await login({ email, password, demoRole: role })
      navigate(authenticatedRole === 'participant' ? '/app' : authenticatedRole === 'mentor' ? '/mentor' : authenticatedRole === 'evaluator' ? '/evaluador' : '/admin')
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'No se ha podido iniciar sesión.')
    }
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
          <div className="notice">
            {isSupabaseConfigured
              ? 'Acceso de producción protegido por Supabase.'
              : 'Modo demostración: selecciona un perfil para explorar la aplicación.'}
          </div>
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label htmlFor="email">Correo electrónico</label><input className="field" id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required={isSupabaseConfigured} /></div>
            <div className="form-group"><label htmlFor="password">Contraseña</label><input className="field" id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required={isSupabaseConfigured} /></div>
            {!isSupabaseConfigured && (
              <div>
                <span className="field-label">Perfil de demostración</span>
                <div className="demo-roles">
                  {(Object.keys(roleLabels) as Role[]).map((item) => <button type="button" key={item} className={`demo-role ${role === item ? 'active' : ''}`} onClick={() => setRole(item)}>{roleLabels[item]}</button>)}
                </div>
              </div>
            )}
            {error && <div className="notice" role="alert">{error}</div>}
            <Button type="submit" disabled={loading} icon={<ArrowRight size={17} />}>{loading ? 'Comprobando acceso…' : 'Entrar en ODISSEA HUB'}</Button>
            <Link to="/recuperar-contrasena" className="muted" style={{ textAlign: 'center', fontSize: '.75rem' }}>He olvidado mi contraseña</Link>
          </form>
        </div>
      </section>
    </main>
  )
}
