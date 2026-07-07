import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLocaleStore } from '@/stores/useLocaleStore'

describe('useLocaleStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('defaults to it when no saved locale', () => {
    const store = useLocaleStore()
    expect(store.locale).toBe('it')
  })

  it('reads saved locale from localStorage', () => {
    localStorage.setItem('b2b-locale', 'en')
    const store = useLocaleStore()
    expect(store.locale).toBe('en')
  })

  it('toggleLocale switches between en and it', () => {
    const store = useLocaleStore()
    expect(store.locale).toBe('it')
    store.toggleLocale()
    expect(store.locale).toBe('en')
    store.toggleLocale()
    expect(store.locale).toBe('it')
  })

  it('persists locale to localStorage', async () => {
    const store = useLocaleStore()
    store.setLocale('en')
    await new Promise((r) => setTimeout(r, 0))
    expect(localStorage.getItem('b2b-locale')).toBe('en')
  })

  it('setLocale updates locale', () => {
    const store = useLocaleStore()
    store.setLocale('en')
    expect(store.locale).toBe('en')
  })

  it('setLocale ignores invalid values', () => {
    const store = useLocaleStore()
    store.setLocale('fr')
    expect(store.locale).toBe('it')
  })
})
