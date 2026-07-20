export type Locale = 'en' | 'it'

export interface PlaybookMeta {
  slug: string
  title: string
  category: string
}

export interface Playbook {
  meta: PlaybookMeta
  content: string
}
