import { ref, unref, type Ref } from 'vue'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({ html: true, breaks: true })

export function usePlaybook(slug: Ref<string> | string, locale: Ref<string> | string) {
  const content = ref('')
  const loading = ref(false)
  const error = ref<string | null>(null)

  function getSlug(): string {
    return unref(slug)
  }

  function getLocale(): string {
    return unref(locale)
  }

  function resolvePlaybookPath(s: string, l: string): string {
    return `/playbooks/${s}/${s}_${l.toUpperCase()}.md`
  }

  function resolveFallbackPath(s: string): string {
    return `/playbooks/${s}/${s}_EN.md`
  }

  async function load() {
    const s = getSlug()
    const l = getLocale()

    loading.value = true
    error.value = null
    try {
      const primaryPath = resolvePlaybookPath(s, l)
      let response = await fetch(primaryPath)

      if (!response.ok) {
        const fallbackPath = resolveFallbackPath(s)
        response = await fetch(fallbackPath)
        if (!response.ok) throw new Error('Playbook not found')
      }

      const raw = await response.text()
      const basePath = `/playbooks/${s}/`
      const html = fixImagePaths(md.render(raw), basePath)

      content.value = html
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load playbook'
    } finally {
      loading.value = false
    }
  }

  return { content, loading, error, load }
}

function fixImagePaths(html: string, basePath: string): string {
  return html.replace(/src="(?!https?:\/\/|\/|data:)([^"]+)"/g, `src="${basePath}$1"`)
}
