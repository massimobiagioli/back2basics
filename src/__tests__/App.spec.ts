import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { createI18n } from 'vue-i18n'
import App from '@/App.vue'
import en from '@/locales/en.json'

const i18n = createI18n({ legacy: false, locale: 'it', messages: { en } })
const router = createRouter({ history: createMemoryHistory(), routes: [] })

describe('App', () => {
  it('mounts and renders the layout shell', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), i18n, router],
        stubs: { 'router-view': { template: '<div class="router-view-stub"/>' } },
      },
    })
    expect(wrapper.find('.layout').exists()).toBe(true)
  })

  it('renders the toolbar within the layout', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [createPinia(), i18n, router],
        stubs: { 'router-view': { template: '<div/>' } },
      },
    })
    expect(wrapper.find('.toolbar').exists()).toBe(true)
  })
})
