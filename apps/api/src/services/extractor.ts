import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'
import axios from 'axios'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

const OFFICIAL_URLS: Record<string, string[]> = {
  'toyota':     ['https://www.toyota.com.br/modelos/hilux-cabine-dupla'],
  'mitsubishi': ['https://www.mitsubishimotors.com.br/veiculos/triton'],
  'ford':       ['https://www.ford.com.br/picapes/ranger/', 'https://www.ford.com.br/picapes/ranger-raptor/'],
  'volkswagen': ['https://www.vw.com.br/pt/modelos/amarok.html'],
  'chevrolet':  ['https://www.chevrolet.com.br/caminhonetes/s10'],
}

const INDEPENDENT_URLS: Record<string, string[]> = {
  'toyota':     ['https://www.icarros.com.br/toyota/hilux/versoes/14571'],
  'mitsubishi': ['https://www.icarros.com.br/mitsubishi/l200+triton/versoes/9791'],
  'ford':       ['https://www.icarros.com.br/ford/ranger/versoes/14091'],
  'volkswagen': ['https://www.icarros.com.br/volkswagen/amarok/versoes/9203'],
  'chevrolet':  ['https://www.icarros.com.br/chevrolet/s10/versoes/9074'],
}

const JSON_SCHEMA = `{
  "potencia_cv": number | null,
  "torque_nm": number | null,
  "cilindrada_l": number | null,
  "qtd_marchas": number | null,
  "transmissao_automatica": 0 | 1 | null,
  "motor_diesel": 0 | 1 | null,
  "tracao_4x4_high_low": 0 | 1 | null,
  "airbags_qtd": number | null,
  "anos_garantia": number | null,
  "cabine_dupla": 0 | 1 | null,
  "source_urls": string[],
  "search_queries": string[]
}`

async function fetchPage(url: string): Promise<string> {
  try {
    const res = await axios.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FordPickupIntel/1.0)' },
      timeout: 15000,
      maxRedirects: 5
    })
    return String(res.data)
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 6000)
  } catch {
    return ''
  }
}

async function collectSources(
  brand: string,
  pdfContent?: string
): Promise<{ contents: string[]; urls: string[] }> {
  const brandKey = brand.toLowerCase()
  const allUrls = [
    ...(OFFICIAL_URLS[brandKey] || []),
    ...(INDEPENDENT_URLS[brandKey] || [])
  ]

  const results = await Promise.allSettled(allUrls.map(url => fetchPage(url)))
  const contents: string[] = []
  const successUrls: string[] = []

  results.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.length > 100) {
      contents.push(`=== Fonte: ${allUrls[i]} ===\n${result.value}`)
      successUrls.push(allUrls[i])
    }
  })

  if (pdfContent) {
    contents.push(`=== Fonte: Ficha técnica oficial (PDF) ===\n${pdfContent}`)
    successUrls.push('pdf_oficial')
  }

  return { contents, urls: successUrls }
}

async function extractFromContent(
  brand: string,
  modelName: string,
  version: string,
  yearModel: number,
  contents: string[],
  urls: string[]
): Promise<Record<string, unknown>> {
  const sourcesText = contents.join('\n\n').substring(0, 20000)

  const prompt = `Você é um extrator de especificações técnicas automotivas.
Analise o conteúdo fornecido e extraia os dados do veículo solicitado.
Retorne APENAS JSON válido, sem texto antes ou depois, sem markdown.
Para campos booleanos: 1 se presente, 0 se ausente, null se não encontrado.
Torque em Nm. Potência em cv.

Veículo: ${brand} ${modelName} ${version} ${yearModel}

Fontes:
${sourcesText}

Retorne APENAS este JSON preenchido:
${JSON_SCHEMA}`

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  const clean = text
    .replace(/^```json\s*/m, '')
    .replace(/^```\s*/m, '')
    .replace(/```\s*$/m, '')
    .trim()

  const parsed = JSON.parse(clean)
  parsed.source_urls    = urls
  parsed.search_queries = urls.map(u => `fetch: ${u}`)
  return parsed
}

async function runAgent(
  brand: string,
  modelName: string,
  version: string,
  yearModel: number,
  pdfContent?: string
): Promise<Record<string, unknown>> {
  const { contents, urls } = await collectSources(brand, pdfContent)

  if (contents.length === 0) {
    const fallbackContents = [
      `Use seu conhecimento para fornecer especificações técnicas de: ${brand} ${modelName} ${version} ${yearModel}`
    ]
    return extractFromContent(brand, modelName, version, yearModel, fallbackContents, ['claude_knowledge'])
  }

  return extractFromContent(brand, modelName, version, yearModel, contents, urls)
}

export async function extractVehicleSpecsFromPdf(
  pdfPath: string,
  brand: string,
  modelName: string,
  version: string,
  yearModel: number
): Promise<Record<string, unknown>> {
  const pdfBuffer = fs.readFileSync(pdfPath)
  const base64    = pdfBuffer.toString('base64')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
        { type: 'text', text: 'Extraia todo o texto técnico deste documento.' }
      ]
    }]
  })

  const pdfText = message.content[0].type === 'text' ? message.content[0].text : ''
  return runAgent(brand, modelName, version, yearModel, pdfText)
}

export async function extractVehicleSpecs(
  brand: string,
  modelName: string,
  version: string,
  yearModel: number
): Promise<Record<string, unknown>> {
  return runAgent(brand, modelName, version, yearModel)
}