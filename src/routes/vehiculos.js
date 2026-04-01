const express = require('express')
const router = express.Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'Sin token' })
  try {
    req.usuario = require('jsonwebtoken').verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}

function soloAdmin(req, res, next) {
  if (req.usuario.rol !== 'admin') return res.status(403).json({ error: 'Solo administradores' })
  next()
}

// Listar vehículos de un cliente
router.get('/cliente/:clienteId', verificarToken, async (req, res) => {
  try {
    const vehiculos = await prisma.vehiculo.findMany({
      where: { clienteId: parseInt(req.params.clienteId) },
      include: { recordatorios: true }
    })
    res.json(vehiculos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Crear vehículo
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { clienteId, patente, marca, modelo, anio, color, kmActual, intervaloKm } = req.body
  try {
    const vehiculo = await prisma.vehiculo.create({
      data: { clienteId, patente, marca, modelo, anio, color,
              kmActual: kmActual || 0, intervaloKm: intervaloKm || 10000 }
    })
    res.json(vehiculo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Actualizar km
router.put('/:id/km', verificarToken, soloAdmin, async (req, res) => {
  const { kmActual } = req.body
  try {
    const vehiculo = await prisma.vehiculo.update({
      where: { id: parseInt(req.params.id) },
      data: { kmActual }
    })
    res.json(vehiculo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router