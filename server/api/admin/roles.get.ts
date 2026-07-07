// server/api/admin/roles.get.ts
// import { db } from '~/server/database/db'
import { masterRoles, users, usersToRoles } from '#server/db/schema'
import { eq, asc } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  // 1. Obtener todos los Roles Maestros
  const rolesList = await db.select().from(masterRoles)

  // console.log({ rolesList })
  // 2. Obtener los Usuarios junto con sus Roles Maestros asignados (Mediante un Join)
  const usersRaw = await db
    .select({
      id: users.id,
      email: users.email,
      roleName: usersToRoles.roleName,
      avatar: users.avatar
    })
    .from(users)
    .leftJoin(usersToRoles, eq(users.id, usersToRoles.userId))
    .orderBy(asc(users.email))

  // console.log({ usersRaw })
  // Agrupar los roles por usuario en un objeto estructurado limpio
  const usersWithRoles = usersRaw.reduce((acc, current) => {
    const found = acc.find(u => u.id === current.id)
    if (found) {
      if (current.roleName) found.roles.push(current.roleName)
    } else {
      acc.push({
        id: current.id,
        email: current.email,
        avatar: current.avatar,
        roles: current.roleName ? [current.roleName] : []
      })
    }
    return acc
  }, [] as { id: number, email: string, roles: string[] }[])

  return {
    roles: rolesList,
    users: usersWithRoles
  }
})
