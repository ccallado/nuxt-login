declare module '#auth-utils' {
  interface User {
    name: string
    email: string
    avatar: string
    nombre: string
    bio: string
    role: 'user' | 'editor' | 'admin'
  }

  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}
