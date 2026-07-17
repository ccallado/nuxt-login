export default defineNuxtRouteMiddleware(async (to) => {
  const { user, loggedIn, fetch: refreshSession } = useUserSession()

  // console.log({ aut: user.value?.authorizations })
  // 1. CONTROL DE ACCESO GLOBAL (Siempre al principio)
  // Evita bucles infinitos y protege las páginas públicas
  if (loggedIn.value && (to.path === '/login' || to.path === '/register')) {
    return navigateTo('/')
  }

  if (!loggedIn.value && to.path !== '/login' && to.path !== '/register') {
    return navigateTo('/login')
  }

  // Si no hay sesión activa tras el filtro anterior, detenemos cualquier proceso
  if (!loggedIn.value) return

  // 2. FILTRO DE METADATOS SAP
  const autobj = to.meta.autobj as string[] | undefined
  const autact = to.meta.autact as string[] | undefined
  const autvar = to.meta.autvar as Record<string, string> | undefined

  // Si la página de destino no requiere autorizaciones específicas SAP, permitimos el acceso libre
  if (!autobj || autobj.length === 0) {
    return
  }

  // 3. SINCRONIZACIÓN EN CALIENTE / TIEMPO REAL (Postgresql)
  try {
    const syncCheck = await $fetch<{ mustRefresh: boolean }>('/api/auth/sync-check', {
      credentials: 'include'
    })

    if (syncCheck?.mustRefresh) {
      await refreshSession()
      // console.log('🔄 Autorizaciones actualizadas en caliente para el usuario activo.')
    }
  } catch (error) {
    console.error('Error al sincronizar autorizaciones en segundo plano:', error)
  }

  // 4. PREPARACIÓN DE PERMISOS BLINDADA PARA TYPESCRIPT
  const { checkAuthority } = useSAPAuth()

  // Extraemos el primer índice asegurando un string primitivo con ?? ''
  const objReq: string = autobj[0] ?? ''

  // 👑 CORRECCIÓN DE TIPOS: Forzamos la extracción limpia del string y agregamos respaldo estricto
  const actReq: string = (autact && autact.length > 0) ? (autact[0] ?? '03') : '03'

  const varReq: Record<string, string> = autvar ?? {}

  // 5. EVALUACIÓN FINAL DE AUTORIDAD SAP
  if (!user.value || !checkAuthority(objReq, actReq, varReq)) {
    return navigateTo('/unauthorized')
  }
})
