import jwt from "jsonwebtoken"

interface GenerateJwtParams {
  userId: number
  secretKey: string
  expiresIn: number
}

export default function (userId, secretKey, expiresIn): GenerateJwtParams {
  return jwt.sign({ userId }, secretKey, { expiresIn })
}
