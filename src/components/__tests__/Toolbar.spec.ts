import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import Toolbar from '@/components/Toolbar.vue'
import { useLocaleStore } from '@/stores/useLocaleStore'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:locale', component: { template: '<div/>' } }],
})

describe('Toolbar', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  function mountOptions() {
    return {
      global: { plugins: [router] },
    }
  }

  it('renders the project title', () => {
    const wrapper = mount(Toolbar, mountOptions())
    expect(wrapper.find('.toolbar__logo').text()).toBe('Back 2 Basics')
  })

  it('renders a language switcher button', () => {
    const wrapper = mount(Toolbar, mountOptions())
    expect(wrapper.find('.toolbar__lang-btn').exists()).toBe(true)
  })

  it('renders a hamburger button', () => {
    const wrapper = mount(Toolbar, mountOptions())
    expect(wrapper.find('.toolbar__hamburger').exists()).toBe(true)
  })

  it('has BEM classes', () => {
    const wrapper = mount(Toolbar, mountOptions())
    expect(wrapper.find('.toolbar').exists()).toBe(true)
    expect(wrapper.find('.toolbar__logo').exists()).toBe(true)
    expect(wrapper.find('.toolbar__actions').exists()).toBe(true)
  })

  it('displays the current locale as button text', async () => {
    const wrapper = mount(Toolbar, mountOptions())
    const store = useLocaleStore()
    expect(wrapper.find('.toolbar__lang-btn').text()).toBe('IT')
    store.toggleLocale()
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.toolbar__lang-btn').text()).toBe('EN')
  })

  it('toggles locale when language button is clicked', async () => {
    const wrapper = mount(Toolbar, mountOptions())
    const store = useLocaleStore()
    expect(store.locale).toBe('it')
    await wrapper.find('.toolbar__lang-btn').trigger('click')
    expect(store.locale).toBe('en')
  })
})
