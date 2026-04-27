import { FastifyInstance } from 'fastify'
import { AppDataSource } from '@ford-intel/database'
import { Vehicle } from '@ford-intel/database'

export async function vehicleRoutes(app: FastifyInstance) {
  const repo = AppDataSource.getRepository(Vehicle)

  app.get('/vehicles', async () => {
    return repo.find({ relations: ['spec', 'segment'] })
  })

  app.get('/vehicles/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const vehicle = await repo.findOne({
      where: { id },
      relations: ['spec', 'segment']
    })

    if (!vehicle) {
      return reply.status(404).send({ error: 'Veículo não encontrado' })
    }

    return vehicle
  })

  app.post('/vehicles', async (req, reply) => {
    const { brand, model, version, yearModel, yearModelEnd, isMidyear } = req.body as {
      brand: string
      model: string
      version: string
      yearModel?: number
      yearModelEnd?: number
      isMidyear?: boolean
    }

    const vehicle = repo.create({ brand, model, version, yearModel, yearModelEnd, isMidyear })
    await repo.save(vehicle)

    return reply.status(201).send(vehicle)
  })
}