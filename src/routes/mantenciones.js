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

// Historial de mantenciones de un vehículo
router.get('/vehiculo/:vehiculoId', verificarToken, async (req, res) => {
  try {
    const mantenciones = await prisma.mantencion.findMany({
      where: { vehiculoId: parseInt(req.params.vehiculoId) },
      orderBy: { fechaServicio: 'desc' }
    })
    res.json(mantenciones)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Agendar mantención
router.post('/', verificarToken, soloAdmin, async (req, res) => {
  const { vehiculoId, tipo, descripcion, kmEnServicio, fechaServicio, costo, mecanico } = req.body
  try {
    const vehiculo = await prisma.vehiculo.findUnique({ where: { id: vehiculoId } })
    if (!vehiculo) return res.status(404).json({ error: 'Vehículo no encontrado' })

    // Crear mantención
    const mantencion = await prisma.mantencion.create({
      data: { vehiculoId, tipo, descripcion, kmEnServicio,
              fechaServicio: new Date(fechaServicio), costo, mecanico, estado: 'realizado' }
    })

    // Calcular próximo servicio
    const kmProximo = kmEnServicio + vehiculo.intervaloKm
    const fechaBase = new Date(fechaServicio)
    fechaBase.setMonth(fechaBase.getMonth() + 6)

    // Crear o actualizar recordatorio
    await prisma.recordatorio.upsert({
      where: { vehiculoId },
      create: { vehiculoId, tipo, kmProximo, fechaProxima: fechaBase, notificado: false },
      update: { tipo, kmProximo, fechaProxima: fechaBase, notificado: false }
    })

    // Actualizar km actual del vehículo
    await prisma.vehiculo.update({
      where: { id: vehiculoId },
      data: { kmActual: kmEnServicio }
    })

    res.json({ ...mantencion, kmProximo, fechaProxima: fechaBase })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router