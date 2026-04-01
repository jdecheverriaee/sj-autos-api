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
    res.status(401).json({ error: 'Token invalido' })
  }
}

router.get('/proximos', verificarToken, async (req, res) => {
  try {
    const hoy = new Date()
    const vehiculos = await prisma.vehiculo.findMany({
      include: {
        recordatorios: true,
        cliente: true
      }
    })
    const alertas = []
    for (const v of vehiculos) {
      for (const r of v.recordatorios) {
        alertas.push({
          id: r.id,
          tipo: r.tipo,
          kmProximo: r.kmProximo,
          kmActual: v.kmActual,
          kmRestantes: r.kmProximo - v.kmActual,
          fechaProxima: r.fechaProxima,
          diasRestantes: r.fechaProxima ? Math.ceil((new Date(r.fechaProxima) - hoy) / 86400000) : null,
          vehiculo: v.marca + ' ' + v.modelo + ' ' + v.patente,
          cliente: v.cliente.nombre
        })
      }
    }
    res.json(alertas)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

module.exports = router
