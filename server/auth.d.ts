declare module '#auth-utils' {
  interface User {
    name: string
    email: string
    avatar: string
    nombre: string

  }

  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}
