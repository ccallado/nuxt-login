declare module '#auth-utils' {
  interface User {
    id: number
    sessionId: string
    name: string
    email: string
    avatar: string
    nombre: string
    bio: string
    authorizations: SAPAuthorization[]
    sessionCreatedAt: Date
  }

  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}
