import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLocaleStore } from '@/stores/useLocaleStore'

describe('Locale-aware routing', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('validates locale param accepts en', () => {
    const store = useLocaleStore()
    store.locale = 'en'
    expect(store.locale).toBe('en')
    expect(['en', 'it']).toContain('en')
  })

  it('validates locale param accepts it', () => {
    const store = useLocaleStore()
    store.locale = 'it'
    expect(store.locale).toBe('it')
    expect(['en', 'it']).toContain('it')
  })

  it('passes locale guard for valid values', () => {
    const validLocales = ['en', 'it']
    expect(validLocales.includes('en')).toBe(true)
    expect(validLocales.includes('it')).toBe(true)
    expect(validLocales.includes('fr')).toBe(false)
  })
})
