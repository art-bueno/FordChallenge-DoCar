import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const SYSTEM_PROMPT = `Você é um especialista em extração de dados de documentos técnicos automotivos.

Você receberá um documento oficial de uma montadora. Leia com atenção e extraia TODOS os dados técnicos presentes.

Regras:
- Leia o documento inteiro antes de responder
- Extraia TODOS os valores numéricos e técnicos que encontrar
- Converta unidades quando necessário: kgf.m × 9.81 = Nm, litros × 1000 = cc
- Se encontrar potência em cv, use diretamente
- Se encontrar torque em kgf.m, converta para Nm multiplicando por 9.81
- Se o documento mencionar "V6", cylinders = 6. Se "4 em linha", cylinders = 4
- Se mencionar "4WD" ou "4x4", drive = "4x4"
- Se mencionar "reduzida" ou "4LLc", four_low = true
- Se mencionar "ABS", has_abs = true
- Se mencionar "ESC" ou "controle de estabilidade", has_esc = true
- Se mencionar "piloto automático adaptativo" ou "ACC", has_adaptive_cruise = true
- Se mencionar "piloto automático" sem adaptativo, has_cruise = true
- Se mencionar "câmera 360°", camera_system = "360°"
- Se mencionar apenas "câmera de ré", camera_system = "traseira"
- Se mencionar "carregador sem fio" ou "wireless", has_wireless_charge = true
- Use null APENAS quando o dado realmente não aparecer no documento
- Retorne APENAS JSON válido, sem texto antes ou depois, sem markdown

Schema obrigatório de saída:
{
  "engine_name": string | null,
  "displacement_cc": number | null,
  "power_cv": number | null,
  "torque_nm": number | null,
  "fuel_type": string | null,
  "cylinders": number | null,
  "gearbox": string | null,
  "drive": string | null,
  "four_low": boolean | null,
  "payload_kg": number | null,
  "towing_kg": number | null,
  "fuel_tank_l": number | null,
  "length_mm": number | null,
  "width_mm": number | null,
  "height_mm": number | null,
  "wheelbase_mm": number | null,
  "ground_clearance_mm": number | null,
  "bed_length_mm": number | null,
  "front_suspension": string | null,
  "rear_suspension": string | null,
  "front_brakes": string | null,
  "rear_brakes": string | null,
  "airbags": number | null,
  "has_abs": boolean | null,
  "has_esc": boolean | null,
  "has_cruise": boolean | null,
  "has_adaptive_cruise": boolean | null,
  "infotainment_inch": number | null,
  "has_wireless_charge": boolean | null,
  "camera_system": string | null,
  "base_price_brl": number | null
}`

/**
 * Extrai especificações técnicas de um veículo a partir de um PDF oficial.
 * O PDF é lido diretamente pelo Claude, garantindo precisão máxima.
 */
export async function extractVehicleSpecsFromPdf(
  pdfPath: string,
  brand: string,
  model: string,
  version: string,
  yearModel: number
): Promise<Record<string, unknown>> {
  const pdfBuffer = fs.readFileSync(pdfPath)
  const pdfBase64 = pdfBuffer.toString('base64')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64
            }
          },
          {
            type: 'text',
            text: `Extraia as especificações técnicas de:
Marca: ${brand}
Modelo: ${model}
Versão: ${version}
Ano: ${yearModel}

Leia o documento acima e extraia apenas os dados presentes nele.`
          }
        ]
      }
    ]
  })

  const text = message.content[0].type === 'text'
    ? message.content[0].text
    : ''

  const clean = text
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()

  return JSON.parse(clean) as Record<string, unknown>
}

/**
 * Extrai especificações técnicas usando apenas o conhecimento do modelo.
 * Usado como fallback quando não há PDF disponível.
 */
export async function extractVehicleSpecs(
  brand: string,
  model: string,
  version: string,
  yearModel: number
): Promise<Record<string, unknown>> {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extraia as especificações técnicas de:
Marca: ${brand}
Modelo: ${model}
Versão: ${version}
Ano: ${yearModel}

Use apenas dados que você tem certeza absoluta sobre este veículo no mercado brasileiro.`
      }
    ]
  })

  const text = message.content[0].type === 'text'
    ? message.content[0].text
    : ''

  const clean = text
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()

  return JSON.parse(clean) as Record<string, unknown>
}