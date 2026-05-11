import Anthropic from '@anthropic-ai/sdk'
import * as fs from 'fs'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const SYSTEM_PROMPT = `Você é um especialista em extração de dados de documentos técnicos automotivos.

Você receberá um documento oficial de uma montadora. Leia com atenção e extraia TODOS os dados técnicos presentes.

Regras de extração:
- Leia o documento inteiro antes de responder
- Extraia TODOS os valores numéricos e técnicos que encontrar
- Para campos booleanos: use 1 se o item está presente/disponível, 0 se não está, null se não há informação
- Para campos numéricos: extraia o valor exato mencionado no documento, null se não encontrar
- Converta kgf.m para Nm multiplicando por 9.81
- Retorne APENAS JSON válido, sem texto antes ou depois, sem markdown

Schema obrigatório de saída (138 campos exatos):
{
  "peso_ordem_marcha_kg": number | null,
  "cilindrada_l": number | null,
  "potencia_cv": number | null,
  "torque_nm": number | null,
  "economia_combustivel_kmpl": number | null,
  "transmissao_automatica": 0 | 1 | null,
  "motor_flex": 0 | 1 | null,
  "tecnologia_turbo": 0 | 1 | null,
  "qtd_marchas": number | null,
  "fhev": 0 | 1 | null,
  "phev": 0 | 1 | null,
  "bev": 0 | 1 | null,
  "motor_diesel": 0 | 1 | null,
  "paddle_shift": 0 | 1 | null,
  "e_shifter": 0 | 1 | null,
  "tecnologia_biturbo": 0 | 1 | null,
  "motor_eletrico": 0 | 1 | null,
  "e_autonomy_km": number | null,
  "rodas_liga_leve": 0 | 1 | null,
  "rodas_polegadas": number | null,
  "pneus_atr": 0 | 1 | null,
  "pneus_runflat": 0 | 1 | null,
  "pneus_atr_plus": 0 | 1 | null,
  "pneus_auto_vedantes": 0 | 1 | null,
  "estepe_full_size": 0 | 1 | null,
  "estepe_temporario": 0 | 1 | null,
  "loja_aplicativos": 0 | 1 | null,
  "assistente_digital": 0 | 1 | null,
  "trava_destrava_remoto": 0 | 1 | null,
  "ignicao_remota": 0 | 1 | null,
  "localizacao_veiculo": 0 | 1 | null,
  "vehicle_health_alerts": 0 | 1 | null,
  "send_poi_navigation": 0 | 1 | null,
  "geofencing_guard_mode": 0 | 1 | null,
  "vehicle_recovery": 0 | 1 | null,
  "ubi": 0 | 1 | null,
  "wifi_hotspot": 0 | 1 | null,
  "atualizacao_ota": 0 | 1 | null,
  "bluetooth": 0 | 1 | null,
  "camera_traseira": 0 | 1 | null,
  "camera_180_graus": 0 | 1 | null,
  "navegador_gps": 0 | 1 | null,
  "navegador_gps_atualizavel": 0 | 1 | null,
  "comando_voz": 0 | 1 | null,
  "alto_falantes_qtd": number | null,
  "head_up_display": 0 | 1 | null,
  "sistema_som_premium": 0 | 1 | null,
  "espelhamento_android_apple_cabo": 0 | 1 | null,
  "multimidia_polegadas": number | null,
  "assistencia_emergencia": 0 | 1 | null,
  "carregamento_wireless": 0 | 1 | null,
  "camera_360": 0 | 1 | null,
  "android_apple_wireless": 0 | 1 | null,
  "painel_instrumento_colorido_pol": number | null,
  "usb_qtd": number | null,
  "ar_cond_saida_2a_fileira": 0 | 1 | null,
  "ar_cond_automatico_digital": 0 | 1 | null,
  "ar_cond_duas_zonas": 0 | 1 | null,
  "controle_anti_capotamento": 0 | 1 | null,
  "freio_automatico_parado": 0 | 1 | null,
  "tpms": 0 | 1 | null,
  "controle_descida": 0 | 1 | null,
  "controle_adaptativo_carga": 0 | 1 | null,
  "controle_reboque": 0 | 1 | null,
  "trail_control": 0 | 1 | null,
  "freio_automatico_apos_impacto": 0 | 1 | null,
  "assistencia_direcao_defensiva": 0 | 1 | null,
  "airbags_qtd": number | null,
  "piloto_automatico": 0 | 1 | null,
  "limitador_velocidade": 0 | 1 | null,
  "piloto_automatico_adaptativo": 0 | 1 | null,
  "sistema_permanencia_faixa": 0 | 1 | null,
  "sensor_estac_traseiro": 0 | 1 | null,
  "sensor_estac_dianteiro": 0 | 1 | null,
  "sensor_chuva": 0 | 1 | null,
  "retrovisor_eletrocromico": 0 | 1 | null,
  "sensor_crepuscular": 0 | 1 | null,
  "detector_fadiga": 0 | 1 | null,
  "freio_mao_eletronico": 0 | 1 | null,
  "retrovisor_eletrico": 0 | 1 | null,
  "blis": 0 | 1 | null,
  "reconhecimento_sinais_transito": 0 | 1 | null,
  "aeb": 0 | 1 | null,
  "retrovisor_rebatimento_eletrico": 0 | 1 | null,
  "alerta_colisao_frontal": 0 | 1 | null,
  "sistema_centralizacao_faixa": 0 | 1 | null,
  "acc_stop_and_go": 0 | 1 | null,
  "blis_alerta_trafego_cruzado": 0 | 1 | null,
  "reverse_aeb": 0 | 1 | null,
  "keyless_entry_peps": 0 | 1 | null,
  "alarme_volumetrico": 0 | 1 | null,
  "global_opening": 0 | 1 | null,
  "trava_eletrica_portas": 0 | 1 | null,
  "vidro_eletrico_traseiro": 0 | 1 | null,
  "global_closing": 0 | 1 | null,
  "bancos_couro": 0 | 1 | null,
  "manopla_cambio_couro": 0 | 1 | null,
  "volante_couro": 0 | 1 | null,
  "painel_soft_touch": 0 | 1 | null,
  "teto_solar_eletrico": 0 | 1 | null,
  "teto_solar_panoramico": 0 | 1 | null,
  "banco_traseiro_aquecido": 0 | 1 | null,
  "bancos_aquecimento_frontal": 0 | 1 | null,
  "bancos_refrigerados_frontal": 0 | 1 | null,
  "banco_posicoes_eletrico": number | null,
  "farois_full_led": 0 | 1 | null,
  "drl_signature": 0 | 1 | null,
  "farol_alto_automatico": 0 | 1 | null,
  "lanternas_led_parcial": 0 | 1 | null,
  "lanternas_full_led": 0 | 1 | null,
  "farois_neblina_led": 0 | 1 | null,
  "farois_matrix_led": 0 | 1 | null,
  "iluminacao_cacamba": 0 | 1 | null,
  "tracao_4x4_high_low": 0 | 1 | null,
  "diferencial_traseiro_blocante": 0 | 1 | null,
  "santo_antonio": 0 | 1 | null,
  "estribo_lateral_plataforma": 0 | 1 | null,
  "protetor_cacamba": 0 | 1 | null,
  "terrain_management_system": 0 | 1 | null,
  "tracao_awd": 0 | 1 | null,
  "suspensao_fox_live_valve": 0 | 1 | null,
  "anos_garantia": number | null,
  "apoio_braco_traseiro": 0 | 1 | null,
  "cabine_dupla": 0 | 1 | null,
  "degrau_acesso_cacamba": 0 | 1 | null,
  "assistente_tampa_cacamba": 0 | 1 | null,
  "travamento_eletrico_cacamba": 0 | 1 | null,
  "engate_reboque_3500kg": 0 | 1 | null,
  "bussola_inclinometro": 0 | 1 | null,
  "console_apoio_braco_dianteiro": 0 | 1 | null,
  "disco_freio_traseiro": 0 | 1 | null,
  "ganchos_reboque_qtd": number | null,
  "protetor_carter": 0 | 1 | null,
  "protetor_tanque": 0 | 1 | null,
  "tapete_borracha": 0 | 1 | null,
  "iluminacao_ambiente": 0 | 1 | null,
  "tomada_12v": 0 | 1 | null,
  "bagageiro_teto_long": 0 | 1 | null
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
    max_tokens: 4096,
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

Leia o documento acima e preencha TODOS os 138 campos do schema.
Para cada item presente no documento use 1, ausente use 0, sem informação use null.`
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
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Extraia as especificações técnicas de:
Marca: ${brand}
Modelo: ${model}
Versão: ${version}
Ano: ${yearModel}

Use seu conhecimento sobre este veículo no mercado brasileiro.
Preencha TODOS os 138 campos do schema.
Para cada item presente no veículo use 1, ausente use 0, sem certeza use null.`
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