// export const useSAPAuth = () => {
//   const { user, loggedIn, fetch } = useUserSession()

//   const checkAuthority = (
//     objectName: typeof SAP_OBJECTS_ENUM[number], // Tipado estricto de tus 50 objetos
//     activity: string,                            // Ej: '01', '02', '03'
//     orgFilters?: Record<string, string>          // Ej: { BUKRS: '1000', WERKS: '2000' }
//   ): boolean => {
//     console.log({ user: user })
//     console.log({ loggedIn: loggedIn })

//     if (!loggedIn.value || !user.value?.authorizations) return false

//     // 1. Buscar el objeto de autorización
//     const authObject = user.value.authorizations.find(auth => auth.object === objectName)
//     console.log({ objeto: objectName })
//     console.log({ authObject: authObject })

//     if (!authObject) return false

//     // 2. Verificar la actividad (ACTVT)
//     const hasActivity = authObject.fields.ACTVT.includes(activity) || authObject.fields.ACTVT.includes('*')
//     console.log({ hasActivity: hasActivity })
//     if (!hasActivity) return false
//     console.log({ orgFilters: orgFilters })
//     // 3. Verificar todos los campos organizacionales provistos
//     if (orgFilters) {
//       for (const [fieldName, requiredValue] of Object.entries(orgFilters)) {
//         const allowedValues = authObject.fields[fieldName]
//         console.log({ allowedValues: allowedValues })
//         if (!allowedValues) return false // El objeto del usuario no tiene este campo organizacional

//         const hasOrgAccess = allowedValues.includes(requiredValue) || allowedValues.includes('*')
//         console.log({ hasOrgAccess: hasOrgAccess })
//         if (!hasOrgAccess) return false // No tiene acceso a este centro o sociedad específico
//       }
//     }

//     return true
//   }

//   return { checkAuthority, refreshSession: fetch }
// }
import { unref } from 'vue'

export const useSAPAuth = () => {
  const { user, loggedIn, fetch } = useUserSession()

  const checkAuthority = (
    objectName: string,
    activity: string,
    orgFilters?: Record<string, string>,
    // 🌟 MEJORA CLAVE: Añadimos un parámetro opcional para inyectar autorizaciones frescas
    // directamente, saltándonos la caché si acabamos de actualizar el perfil.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    overrideAuths?: any[]
  ): boolean => {
    // Forzamos el desempaquetado limpio con unref para evitar retrasos de reactividad
    const currentUser = unref(user)
    const isLoggedIn = unref(loggedIn)

    // Determinamos qué matriz usar: las autorizaciones frescas pasadas o las de la sesión
    const authorizations = overrideAuths || currentUser?.authorizations

    if (!isLoggedIn || !authorizations || !Array.isArray(authorizations)) {
      return false
    }

    // 1. Buscar el objeto de autorización en la matriz activa
    const authObject = authorizations.find(auth => auth.object === objectName)

    if (!authObject || !authObject.fields) {
      return false
    }

    // 2. Verificar la actividad (ACTVT)
    const hasActivity
      = Array.isArray(authObject.fields.ACTVT)
        && (authObject.fields.ACTVT.includes(activity) || authObject.fields.ACTVT.includes('*'))

    if (!hasActivity) return false

    // 3. Verificar todos los campos organizacionales provistos
    if (orgFilters) {
      for (const [fieldName, requiredValue] of Object.entries(orgFilters)) {
        const allowedValues = authObject.fields[fieldName]
        if (!allowedValues || !Array.isArray(allowedValues)) return false

        const hasOrgAccess = allowedValues.includes(requiredValue) || allowedValues.includes('*')
        if (!hasOrgAccess) return false
      }
    }

    return true
  }

  return {
    checkAuthority,
    refreshSession: fetch,
    // Exponemos el usuario de forma reactiva por si necesitas usar v-if="user?.nombre"
    user
  }
}
