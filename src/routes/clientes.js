const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Sin token' })
  try {
    const jwt = require('jsonwebtoken')
    req.usuario = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' })
  next()
}

// Listar todos
router.get('/', verificarToken, async (req, res) => {
  try {
    const clientes = await prisma.cliente.findMany({
      include: { vehiculos: true },
      orderBy: { createdAt: 'desc' }
    })
    res.json(clientes)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, telefono, email, rut, direccion } = req.body
  try {
    const cliente = await prisma.cliente.create({
      data: { nombre, telefono, email, rut, direccion }
    })
    res.json(cliente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Editar
router.put('/:id', verificarToken, soloAdmin, async (req, res) => {
  const { nombre, telefono, email, rut, direccion } = req.body
  try {
    const cliente = await prisma.cliente.update({
      where: { id: parseInt(req.params.id) },
      data: { nombre, telefono, email, rut, direccion }
    })
    res.json(cliente)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Eliminar
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
  try {
    await prisma.cliente.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ mensaje: 'Cliente eliminado' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router