import { ref } from 'vue'
import type { PlaybookMeta } from '@/types/playbook'

export function usePlaybookIndex() {
  const playbooks = ref<PlaybookMeta[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchIndex() {
    loading.value = true
    error.value = null
    try {
      const response = await fetch('/playbooks/manifest.json')
      if (!response.ok) throw new Error('Failed to load manifest')
      const data = await response.json()
      playbooks.value = data.playbooks || []
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Unknown error'
    } finally {
      loading.value = false
    }
  }

  return { playbooks, loading, error, fetchIndex }
}
