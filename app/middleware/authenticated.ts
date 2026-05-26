export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (loggedIn.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/admin/dashboard')
  }

  if (!loggedIn.value && to.path != '/login' && to.path != '/register') {
    return navigateTo('/login')
  }

  // if (!loggedIn.value && to.path != '/register') {
  //   return navigateTo('/register')
  // }
})
