import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Footer from '@/components/Footer.vue'

describe('Footer', () => {
  it('renders copyright text', () => {
    const wrapper = mount(Footer)
    expect(wrapper.text()).toContain('Back 2 Basics')
    expect(wrapper.text()).toContain('2026')
  })

  it('has BEM class', () => {
    const wrapper = mount(Footer)
    expect(wrapper.find('.footer').exists()).toBe(true)
  })
})
