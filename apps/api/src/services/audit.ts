import { AppDataSource, AuditLog } from '@ford-intel/database'
import { FastifyRequest } from 'fastify'

/**
 * Registra uma ação no audit log.
 * Sanitiza dados sensíveis antes de persistir.
 */
export async function logAudit(
  action: string,
  req: FastifyRequest,
  status: 'success' | 'error',
  payload?: Record<string, unknown>,
  errorMessage?: string
) {
  try {
    const repo = AppDataSource.getRepository(AuditLog)

    const sanitized = payload ? sanitizePayload(payload) : null

    const log = repo.create({
      action,
      ip: req.ip,
      userAgent: req.headers['user-agent']?.substring(0, 255) ?? null,
      payload: sanitized ? JSON.stringify(sanitized) : null,
      status,
      errorMessage: errorMessage?.substring(0, 500) ?? null,
    })

    await repo.save(log)
  } catch {
    console.error('[AUDIT] Falha ao registrar log de auditoria')
  }
}

/**
 * Remove campos sensíveis antes de salvar no log.
 */
function sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
  const sensitive = ['password', 'token', 'apiKey', 'api_key', 'secret', 'authorization']

  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => {
      if (sensitive.some(s => key.toLowerCase().includes(s))) {
        return [key, '[REDACTED]']
      }
      return [key, value]
    })
  )
}