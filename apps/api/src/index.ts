import * as dotenv from 'dotenv'
dotenv.config()

import Fastify from 'fastify'
import cors from '@fastify/cors'
import { AppDataSource } from '@ford-intel/database'
import { vehicleRoutes } from './routes/vehicles'

const app = Fastify({ logger: true })

app.register(cors, { origin: '*' })

app.get('/health', async () => {
  return { status: 'ok', project: 'Ford Pickup Intel' }
})

const start = async () => {
  try {
    await AppDataSource.initialize()
    console.log('Banco de dados conectado!')

    await app.register(vehicleRoutes, { prefix: '/api' })

    await app.listen({ port: 3333, host: '0.0.0.0' })
    console.log('API rodando em http://localhost:3333')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()