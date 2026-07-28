import { Orbit } from 'lucide-react'
import { Link } from 'react-router-dom'

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="ODISSEA HUB, inicio">
      <span className="brand__mark"><Orbit size={22} /></span>
      {!compact && <span><strong>ODISSEA</strong><small>HUB</small></span>}
    </Link>
  )
}
