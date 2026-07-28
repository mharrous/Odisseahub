import { clsx } from 'clsx'
import type { ReactNode } from 'react'

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' }) {
  return <span className={clsx('badge', `badge--${tone}`)}>{children}</span>
}
