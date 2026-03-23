import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../prisma'

const generateAccessToken = (id: string, name: string, role: string) =>
  jwt.sign({ id, name, role }, process.env.JWT_SECRET!, { expiresIn: '15m' })

const generateRefreshToken = (id: string) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' })

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password || !role)
      return res.status(400).json({ error: 'All fields required' })

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return res.status(400).json({ error: 'Email already exists' })

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role }
    })

    return res.status(201).json({ message: 'User created', userId: user.id })
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.status(400).json({ error: 'All fields required' })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = await bcrypt.compare(password, user.password)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const accessToken = generateAccessToken(user.id, user.name, user.role)
    const refreshToken = generateRefreshToken(user.id)

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    })

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    })

    return res.json({
      accessToken,
      user: { id: user.id, name: user.name, role: user.role }
    })
  } catch (err) {
    return res.status(500).json({ error: 'Server error' })
  }
}

export const refresh = async (req: Request, res: Response) => {
  try {
    const token = req.cookies.refreshToken
    if (!token) return res.status(401).json({ error: 'No refresh token' })

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } })

    if (!user || user.refreshToken !== token)
      return res.status(403).json({ error: 'Invalid refresh token' })

    const accessToken = generateAccessToken(user.id, user.name, user.role)
    return res.json({ accessToken })
  } catch {
    return res.status(403).json({ error: 'Invalid refresh token' })
  }
}

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken
  if (token) {
    await prisma.user.updateMany({
      where: { refreshToken: token },
      data: { refreshToken: null }
    })
  }
  res.clearCookie('refreshToken')
  return res.json({ message: 'Logged out' })
}