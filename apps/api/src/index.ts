import * as dotenv from 'dotenv'
dotenv.config()

import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import { AppDataSource } from '@ford-intel/database'
import { vehicleRoutes } from './routes/vehicles'
import { authRoutes } from './routes/auth'
import { authenticate } from './middlewares/rbac'
import { verifyToken } from './services/auth'
import { logAudit } from './services/audit'

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:8081')
  .split(',')
  .map(o => o.trim())

const app = Fastify({ logger: true })

/**
 * Hook global de autenticação JWT.
 * Rotas públicas: /health e /api/auth/*
 * Rotas protegidas: todas as demais
 */
app.addHook('onRequest', async (req: any, reply) => {
  const publicRoutes = ['/health', '/api/auth/login', '/api/auth/refresh', '/api/auth/register']
  if (publicRoutes.some(r => req.url.startsWith(r))) return

  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    await logAudit('unauthorized_access', req, 'error', { url: req.url }, 'Token ausente')
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token de autorização ausente ou malformado'
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const payload = verifyToken(token)
    if (payload.type !== 'access') throw new Error('Tipo de token inválido')
    req.user = { id: payload.sub, email: payload.email, role: payload.role }
  } catch {
    await logAudit('unauthorized_access', req, 'error', { url: req.url }, 'Token inválido')
    return reply.status(401).send({
      error: 'Unauthorized',
      message: 'Token inválido ou expirado'
    })
  }
})

/**
 * Hook de detecção de eventos suspeitos.
 * Registra respostas 401 e 403 para monitoramento de acessos indevidos.
 */
app.addHook('onResponse', async (req: any, reply) => {
  if (reply.statusCode === 401 || reply.statusCode === 403) {
    await logAudit('suspicious_access', req, 'error',
      { url: req.url, method: req.method, statusCode: reply.statusCode },
      `Acesso negado com status ${reply.statusCode}`
    )
  }
})

app.register(cors, {
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      cb(null, true)
    } else {
      cb(new Error('Origem não permitida pelo CORS'), false)
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
})

app.register(helmet, { contentSecurityPolicy: false })

app.register(rateLimit, {
  max: 30,
  timeWindow: '1 minute',
  errorResponseBuilder: () => ({
    error: 'Too Many Requests',
    message: 'Limite de 30 requisições por minuto atingido'
  })
})

/**
 * Tratamento global de erros — nunca expõe stack trace ou detalhes internos.
 */
app.setErrorHandler((error, req, reply) => {
  app.log.error(error)

  if (error.validation) {
    return reply.status(400).send({
      error: 'Validation Error',
      message: 'Dados de entrada inválidos',
      details: error.validation.map((v: any) => v.message)
    })
  }

  if (error.statusCode === 429) {
    return reply.status(429).send({
      error: 'Too Many Requests',
      message: 'Limite de requisições atingido'
    })
  }

  return reply.status(500).send({
    error: 'Internal Server Error',
    message: 'Ocorreu um erro interno. Tente novamente.'
  })
})

app.get('/health', async () => {
  return { status: 'ok', project: 'Ford Pickup Intel' }
})

const start = async () => {
  try {
    await AppDataSource.initialize()
    console.log('Banco de dados conectado!')

    await app.register(authRoutes, { prefix: '/api' })
    await app.register(vehicleRoutes, { prefix: '/api' })

    await app.listen({ port: 3333, host: '0.0.0.0' })
    console.log('API rodando em http://localhost:3333')
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()