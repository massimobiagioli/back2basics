import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

describe('DefaultLayout', () => {
  it('renders toolbar, sidebar, main content, and footer slots', () => {
    const wrapper = mount(DefaultLayout)

    expect(wrapper.find('.layout__toolbar').exists()).toBe(true)
    expect(wrapper.find('.layout__sidebar').exists()).toBe(true)
    expect(wrapper.find('.layout__main').exists()).toBe(true)
    expect(wrapper.find('.layout__footer').exists()).toBe(true)
  })

  it('applies CSS grid classes', () => {
    const wrapper = mount(DefaultLayout)
    const root = wrapper.find('.layout')
    expect(root.exists()).toBe(true)
  })
})
