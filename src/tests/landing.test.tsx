import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LandingPage } from '../features/public/LandingPage'

describe('página pública', () => {
  it('presenta la convocatoria y accesos principales', () => {
    render(<MemoryRouter><LandingPage /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /una ruta clara/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ver convocatoria/i })).toHaveAttribute('href', '/convocatorias')
    expect(screen.getByRole('link', { name: /entrar al espacio privado/i })).toHaveAttribute('href', '/login')
  })
})
