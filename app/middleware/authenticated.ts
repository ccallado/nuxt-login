export default defineNuxtRouteMiddleware((to) => {
  const { user, loggedIn } = useUserSession()
  const allowedRoles = to.meta.roles as string[]
  const autobj = to.meta.autobj as string[] | undefined
  const autact = to.meta.autact as string[] | undefined
  const autvar = to.meta.autvar as Record<string, string> | undefined // 👑 Cambiado a string[]

  const { checkAuthority } = useSAPAuth()

  // console.log({ autobj: autobj })
  // console.log({ autact: autact })
  // console.log({ autvar: autvar })
  // console.log(allowedRoles)

  // 1. Verificar si el usuario ha iniciado sesión y está en register o login
  if (loggedIn.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/admin/dashboard')
  }

  // 1. Verificar si el usuario no ha iniciado sesión y no está en register o login
  if (!loggedIn.value && to.path != '/login' && to.path != '/register') {
    return navigateTo('/login')
  }

  if (!autobj || autobj.length === 0) return

  // const userRolesArray = user.value.role.split(',')

  const objReq = autobj[0]
  const actReq = autact && autact.length > 0 ? autact[0]: ''
  const varReq = autvar || {}

  // 2. Verificar si el rol de la sesión encriptada tiene acceso
  // if (!user.value || !user.value.role.some(role => allowedRoles.includes(role))) {
  if (!user.value || !checkAuthority(objReq, actReq, varReq)) {
    // if (!user.value || !userRolesArray.some(role => allowedRoles.includes(role))) {
    // console.log({ user })
    // console.log('unauthorized')
    // console.log(!userRolesArray.some(role => allowedRoles.includes(role)))
    return navigateTo('/unauthorized')
  }
})
