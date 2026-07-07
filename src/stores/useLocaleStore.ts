import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export type Locale = 'en' | 'it'

const VALID_LOCALES: Locale[] = ['en', 'it']

export const useLocaleStore = defineStore('locale', () => {
  const saved = localStorage.getItem('b2b-locale') as Locale | null
  const locale = ref<Locale>(saved === 'it' || saved === 'en' ? saved : 'it')

  watch(locale, (val) => {
    localStorage.setItem('b2b-locale', val)
  })

  function setLocale(val: string) {
    if (VALID_LOCALES.includes(val as Locale)) {
      locale.value = val as Locale
    }
  }

  function toggleLocale() {
    locale.value = locale.value === 'en' ? 'it' : 'en'
  }

  return { locale, setLocale, toggleLocale }
})
