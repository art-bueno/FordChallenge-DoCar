import { FastifyInstance } from 'fastify'
import { AppDataSource } from '@ford-intel/database'
import { Vehicle } from '@ford-intel/database'
import { VehicleSpec } from '@ford-intel/database'
import { extractVehicleSpecs, extractVehicleSpecsFromPdf } from '../services/extractor'
import * as path from 'path'
import * as fs from 'fs'

/**
 * Mapeamento de PDFs disponíveis por marca/modelo/versão.
 * Quando disponível, o agente usa o PDF oficial para extração precisa.
 */
const PDF_MAP: Record<string, string> = {
  'ford-ranger-raptor':            'fichaRaptor.pdf',
  'toyota-hilux-srx':              'fichaHilux.pdf',
  'toyota-hilux-srx plus':         'fichaHilux.pdf',
  'mitsubishi-triton-katana':      'fichaTritonMitsubish.pdf',
  'mitsubishi-l200 triton-katana': 'fichaTritonMitsubish.pdf',
}

/**
 * Retorna o caminho do PDF se existir para o veículo informado.
 * A chave é gerada como "marca-modelo-versão" em lowercase.
 */
function findPdfPath(brand: string, model: string, version: string): string | null {
  const key = `${brand}-${model}-${version}`
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()

  const filename = PDF_MAP[key]
  if (!filename) return null

  const fullPath = path.join(process.cwd(), 'pdfs', filename)
  return fs.existsSync(fullPath) ? fullPath : null
}

/**
 * Converte o JSON snake_case retornado pelo agente
 * para os campos camelCase da entidade VehicleSpec.
 */
function mapSpecsToEntity(specs: Record<string, unknown>) {
  return {
    engineName:        specs['engine_name']        as string  ?? null,
    displacementCc:    specs['displacement_cc']    as number  ?? null,
    powerCv:           specs['power_cv']           as number  ?? null,
    torqueNm:          specs['torque_nm']          as number  ?? null,
    fuelType:          specs['fuel_type']          as string  ?? null,
    cylinders:         specs['cylinders']          as number  ?? null,
    gearbox:           specs['gearbox']            as string  ?? null,
    drive:             specs['drive']              as string  ?? null,
    fourLow:           specs['four_low']           as boolean ?? null,
    payloadKg:         specs['payload_kg']         as number  ?? null,
    towingKg:          specs['towing_kg']          as number  ?? null,
    fuelTankL:         specs['fuel_tank_l']        as number  ?? null,
    lengthMm:          specs['length_mm']          as number  ?? null,
    widthMm:           specs['width_mm']           as number  ?? null,
    heightMm:          specs['height_mm']          as number  ?? null,
    wheelbaseMm:       specs['wheelbase_mm']       as number  ?? null,
    groundClearanceMm: specs['ground_clearance_mm'] as number ?? null,
    bedLengthMm:       specs['bed_length_mm']      as number  ?? null,
    frontSuspension:   specs['front_suspension']   as string  ?? null,
    rearSuspension:    specs['rear_suspension']    as string  ?? null,
    frontBrakes:       specs['front_brakes']       as string  ?? null,
    rearBrakes:        specs['rear_brakes']        as string  ?? null,
    airbags:           specs['airbags']            as number  ?? null,
    hasAbs:            specs['has_abs']            as boolean ?? null,
    hasEsc:            specs['has_esc']            as boolean ?? null,
    hasCruise:         specs['has_cruise']         as boolean ?? null,
    hasAdaptiveCruise: specs['has_adaptive_cruise'] as boolean ?? null,
    infotainmentInch:  specs['infotainment_inch']  as number  ?? null,
    hasWirelessCharge: specs['has_wireless_charge'] as boolean ?? null,
    cameraSystem:      specs['camera_system']      as string  ?? null,
    basePriceBrl:      specs['base_price_brl']     as number  ?? null,
  }
}

export async function vehicleRoutes(app: FastifyInstance) {
  const vehicleRepo = AppDataSource.getRepository(Vehicle)
  const specRepo = AppDataSource.getRepository(VehicleSpec)

  app.get('/vehicles', async () => {
    return vehicleRepo.find({ relations: ['spec', 'segment'] })
  })

  app.get('/vehicles/:id', async (req, reply) => {
    const { id } = req.params as { id: string }

    const vehicle = await vehicleRepo.findOne({
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

    const vehicle = vehicleRepo.create({ brand, model, version, yearModel, yearModelEnd, isMidyear })
    await vehicleRepo.save(vehicle)

    return reply.status(201).send(vehicle)
  })

  app.post('/extract', async (req, reply) => {
    const { brand, model, version, yearModel, yearModelEnd, isMidyear } = req.body as {
      brand: string
      model: string
      version: string
      yearModel: number
      yearModelEnd?: number
      isMidyear?: boolean
    }

    if (!brand || !model || !version || !yearModel) {
      return reply.status(400).send({
        error: 'brand, model, version e yearModel são obrigatórios'
      })
    }

    const pdfPath = findPdfPath(brand, model, version)
    const source = pdfPath ? 'pdf_extracted' : 'ia_generated'

    const specs = pdfPath
      ? await extractVehicleSpecsFromPdf(pdfPath, brand, model, version, yearModel)
      : await extractVehicleSpecs(brand, model, version, yearModel)

    const vehicle = vehicleRepo.create({
      brand,
      model,
      version,
      yearModel,
      yearModelEnd,
      isMidyear: isMidyear ?? false
    })
    await vehicleRepo.save(vehicle)

    const spec = specRepo.create({
      vehicle,
      source,
      status: 'active',
      ...mapSpecsToEntity(specs)
    })
    await specRepo.save(spec)

    return reply.status(201).send({ vehicle, spec, source })
  })
}