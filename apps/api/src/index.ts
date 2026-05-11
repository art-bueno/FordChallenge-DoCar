import * as dotenv from 'dotenv'
dotenv.config()

import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { AppDataSource } from '@ford-intel/database'
import { vehicleRoutes } from './routes/vehicles'

const app = Fastify({ logger: true })

const API_KEY = process.env.API_KEY

/**
 * Hook de autenticação — verifica o header X-API-Key em todas as rotas
 * exceto /health, que é pública para monitoramento.
 */
app.addHook('onRequest', async (req, reply) => {
  if (req.url === '/health') return

  const key = req.headers['x-api-key']

  if (!key || key !== API_KEY) {
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Header X-API-Key ausente ou inválido'
    })
  }
})

app.register(cors, { origin: '*' })

app.register(helmet, {
  contentSecurityPolicy: false
})

app.register(rateLimit, {
  max: 30,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    error: 'Too Many Requests',
    message: 'Limite de 30 requisições por minuto atingido'
  })
})

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