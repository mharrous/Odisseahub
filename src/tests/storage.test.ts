import { describe, expect, it } from 'vitest'
import { loadLocal, makeId, saveLocal } from '../lib/storage'

describe('persistencia de desarrollo', () => {
  it('guarda y recupera valores estructurados', () => {
    saveLocal('test-key', { status: 'draft', progress: 45 })
    expect(loadLocal('test-key', null)).toEqual({ status: 'draft', progress: 45 })
  })

  it('genera identificadores con prefijo', () => {
    expect(makeId('program')).toMatch(/^program-/)
  })
})
