export default defineNuxtRouteMiddleware((to) => {
  const { user, loggedIn } = useUserSession()
  const allowedRoles = to.meta.roles as string[]

  console.log(allowedRoles)

  // 1. Verificar si el usuario ha iniciado sesión y está en register o login
  if (loggedIn.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/admin/dashboard')
  }

  // 1. Verificar si el usuario no ha iniciado sesión y no está en register o login
  if (!loggedIn.value && to.path != '/login' && to.path != '/register') {
    return navigateTo('/login')
  }

  if (!allowedRoles) return

  // const userRolesArray = user.value.role.split(',')

  // 2. Verificar si el rol de la sesión encriptada tiene acceso
  if (!user.value || !user.value.role.some(role => allowedRoles.includes(role))) {
  // if (!user.value || !userRolesArray.some(role => allowedRoles.includes(role))) {
    // console.log({ user })
    // console.log('unauthorized')
    // console.log(!userRolesArray.some(role => allowedRoles.includes(role)))
    return navigateTo('/unauthorized')
  }
})
