import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { setActivePinia, createPinia } from 'pinia'
import Sidebar from '@/components/Sidebar.vue'

const router = createRouter({
  history: createMemoryHistory(),
  routes: [{ path: '/:locale', component: { template: '<div/>' } }],
})

describe('Sidebar', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    router.push('/it')
  })

  function mountOptions() {
    return {
      global: {
        plugins: [router],
        stubs: { RouterLink: { template: '<a><slot/></a>' } },
      },
    }
  }

  it('renders the sidebar with BEM classes', () => {
    const wrapper = mount(Sidebar, mountOptions())
    expect(wrapper.find('.sidebar').exists()).toBe(true)
    expect(wrapper.find('.sidebar__title').exists()).toBe(true)
  })

  it('shows loading state initially', () => {
    const wrapper = mount(Sidebar, mountOptions())
    expect(wrapper.find('.sidebar__empty').exists()).toBe(true)
  })

  it('emits close when close button is clicked', async () => {
    const wrapper = mount(Sidebar, mountOptions())
    await wrapper.find('.sidebar__close').trigger('click')
    expect(wrapper.emitted('close')).toBeTruthy()
  })
})
