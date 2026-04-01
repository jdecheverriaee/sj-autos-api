const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' })
    const valido = await bcrypt.compare(password, usuario.password)
    if (!valido) return res.status(401).json({ error: 'Contraseña incorrecta' })
    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    )
    res.json({ token, usuario: { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol } })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/register', async (req, res) => {
  const { nombre, email, password, rol } = req.body
  try {
    const hash = await bcrypt.hash(password, 12)
    const usuario = await prisma.usuario.create({
      data: { nombre, email, password: hash, rol: rol || 'usuario' }
    })
    res.json({ id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router