import { createRouter, createWebHistory, type RouteLocationNormalized } from 'vue-router'

const VALID_LOCALES = ['en', 'it']

const routes = [
  {
    path: '/:locale',
    component: () => import('@/pages/HomePage.vue'),
    beforeEnter: (to: RouteLocationNormalized) => {
      const locale = to.params.locale as string
      if (!VALID_LOCALES.includes(locale)) {
        return { path: '/it' }
      }
    },
  },
  {
    path: '/:locale/playbook/:slug',
    component: () => import('@/pages/PlaybookPage.vue'),
    beforeEnter: (to: RouteLocationNormalized) => {
      const locale = to.params.locale as string
      if (!VALID_LOCALES.includes(locale)) {
        return { path: '/it' }
      }
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/it',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
