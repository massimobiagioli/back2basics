import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useLayoutStore } from '@/stores/useLayoutStore'

describe('useLayoutStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('starts with sidebar closed', () => {
    const store = useLayoutStore()
    expect(store.isSidebarOpen).toBe(false)
  })

  it('toggleSidebar flips the state', () => {
    const store = useLayoutStore()
    store.toggleSidebar()
    expect(store.isSidebarOpen).toBe(true)
    store.toggleSidebar()
    expect(store.isSidebarOpen).toBe(false)
  })

  it('closeSidebar sets to false', () => {
    const store = useLayoutStore()
    store.toggleSidebar()
    store.closeSidebar()
    expect(store.isSidebarOpen).toBe(false)
  })
})
