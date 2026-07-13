declare module '#auth-utils' {
  interface User {
    name: string
    email: string
    nombre: string
    avatar: string
    bio: string
    authorizations: []
  }

  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}
