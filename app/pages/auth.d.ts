declare module '#auth-utils' {
  interface User {
    name: string
  }

  interface UserSession {
    user: User
    loggedInAt: number
  }
}

export {}
