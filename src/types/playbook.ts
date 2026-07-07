export type Locale = 'en' | 'it'

export interface PlaybookMeta {
  slug: string
  title: string
}

export interface Playbook {
  meta: PlaybookMeta
  content: string
}
