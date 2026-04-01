const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/auth', require('./routes/auth'))
app.use('/api/clientes', require('./routes/clientes'))
app.use('/api/vehiculos', require('./routes/vehiculos'))
app.use('/api/mantenciones', require('./routes/mantenciones'))
app.use('/api/recordatorios', require('./routes/recordatorios'))

app.get('/', (req, res) => {
  res.json({ mensaje: '🚗 SJ Autos API funcionando!' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`SJ Autos corriendo en puerto ${PORT}`)
})