declare module '#auth-utils' {
  interface User {
    id: number
    name: string
    email: string
    avatar: string
    nombre: string
    bio: string
    role: 'user' | 'editor' | 'admin'
    authorizations: SAPAuthorization[]
  }

  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}
