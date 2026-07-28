import { useState, type FormEvent } from 'react'
import { ArrowRight } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Brand } from '../../components/Brand'
import { Button } from '../../components/ui/Button'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'

export function PasswordRecoveryPage({ update = false }: { update?: boolean }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setError('')
    setMessage('')

    if (!supabase) {
      setMessage('La recuperación de contraseña solo está disponible con Supabase conectado.')
      return
    }

    setSubmitting(true)
    try {
      if (update) {
        const { error: updateError } = await supabase.auth.updateUser({ password })
        if (updateError) throw updateError
        setMessage('Contraseña actualizada. Ya puedes acceder a ODISSEA HUB.')
        window.setTimeout(() => navigate('/login'), 1200)
      } else {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/restablecer-contrasena`,
        })
        if (resetError) throw resetError
        setMessage('Te hemos enviado un enlace seguro para crear una nueva contraseña.')
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'No se ha podido completar la solicitud.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-art">
        <Brand />
        <div className="auth-quote">
          <span className="eyebrow">Acceso seguro</span>
          <h1>{update ? 'Crea tu nueva contraseña.' : 'Recupera tu acceso.'}</h1>
          <p>Tu cuenta y tus permisos se gestionan de forma segura mediante Supabase.</p>
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-card">
          <span className="eyebrow">ODISSEA HUB</span>
          <h1>{update ? 'Nueva contraseña' : 'Recuperar contraseña'}</h1>
          <p className="muted">{update ? 'Introduce una contraseña nueva para tu cuenta.' : 'Indica el correo asociado a tu cuenta.'}</p>
          {!isSupabaseConfigured && <div className="notice">Esta función no está activa en modo demostración.</div>}
          <form onSubmit={handleSubmit}>
            {update ? (
              <div className="form-group"><label htmlFor="new-password">Nueva contraseña</label><input className="field" id="new-password" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required /></div>
            ) : (
              <div className="form-group"><label htmlFor="recovery-email">Correo electrónico</label><input className="field" id="recovery-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required /></div>
            )}
            {message && <div className="notice" role="status">{message}</div>}
            {error && <div className="notice" role="alert">{error}</div>}
            <Button type="submit" disabled={submitting} icon={<ArrowRight size={17} />}>{submitting ? 'Procesando…' : update ? 'Guardar contraseña' : 'Enviar enlace seguro'}</Button>
            <Link to="/login" className="muted" style={{ textAlign: 'center', fontSize: '.75rem' }}>Volver al acceso</Link>
          </form>
        </div>
      </section>
    </main>
  )
}
