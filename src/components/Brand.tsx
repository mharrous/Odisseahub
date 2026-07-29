import { Orbit } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="Mentoría, inicio">
      <span className="brand__mark"><Orbit size={22} /></span>
      {!compact && <span><strong>Mentoría</strong></span>}
    </Link>
  )
}
