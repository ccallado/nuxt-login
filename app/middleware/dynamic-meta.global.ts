// app/middleware/dynamic-meta.global.ts
export default defineNuxtRouteMiddleware((to) => {
  // Ignorar APIs y recursos estáticos
  if (/^\/?api\/|^\/?_nuxt\/|\./i.test(to.fullPath)) return

  // Si la ruta pertenece a una sección que requiere inicio de sesión obligatorio por defecto
  if (to.path.startsWith('/admin') || to.path.startsWith('/user')) {
    const { loggedIn } = useUserSession()
    if (!loggedIn.value) {
      return navigateTo('/login')
    }
  }
})
