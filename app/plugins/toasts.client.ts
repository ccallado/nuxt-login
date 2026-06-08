export default defineNuxtPlugin((nuxtApp) => {
  const route = useRoute()
  const router = useRouter()
  const toast = useToast()

  const mostrarToast = (mensaje: string) => {
    toast.add({ title: 'Advertencia', description: mensaje })
  }

  // Escuchamos el evento nativo de Nuxt cuando la página termina de cargar completamente
  nuxtApp.hook('page:finish', () => {
    const nuevoMensaje = route.query.msg

    if (nuevoMensaje === 'verification_pending') {
      // 1. Mostramos el aviso visual
      mostrarToast('Por favor, revisa tu correo para verificar la cuenta.')

      // 2. Extraemos 'msg' del objeto de consultas
      const { msg, ...restoDeQueries } = route.query

      // 3. Reemplazamos la URL de forma totalmente segura
      router.replace({
        query: restoDeQueries,
        hash: route.hash
      })
    }
  })
})
