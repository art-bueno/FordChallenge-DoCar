import { FastifyInstance } from 'fastify'
import { AppDataSource } from '@ford-intel/database'
import { Vehicle } from '@ford-intel/database'
import { VehicleSpec } from '@ford-intel/database'
import { extractVehicleSpecs, extractVehicleSpecsFromPdf } from '../services/extractor'
import { logAudit } from '../services/audit'
import { authenticate, requireRole, AuthenticatedRequest } from '../middlewares/rbac'
import * as path from 'path'
import * as fs from 'fs'

const PDF_MAP: Record<string, string> = {
  'ford-ranger-raptor':            'fichaRaptor.pdf',
  'toyota-hilux-srx':              'fichaHilux.pdf',
  'toyota-hilux-srx plus':         'fichaHilux.pdf',
  'mitsubishi-triton-katana':      'fichaTritonMitsubish.pdf',
  'mitsubishi-l200 triton-katana': 'fichaTritonMitsubish.pdf',
}

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

function mapSpecsToEntity(s: Record<string, unknown>) {
  const b = (v: unknown) => v === null ? null : Number(v)
  const n = (v: unknown) => v === null ? null : Number(v)

  return {
    pesoOrdemMarchaKg:              n(s['peso_ordem_marcha_kg']),
    cilindradaL:                    n(s['cilindrada_l']),
    potenciaCv:                     n(s['potencia_cv']),
    torqueNm:                       n(s['torque_nm']),
    economiaCombustivelKmpl:        n(s['economia_combustivel_kmpl']),
    transmissaoAutomatica:          b(s['transmissao_automatica']),
    motorFlex:                      b(s['motor_flex']),
    tecnologiaTurbo:                b(s['tecnologia_turbo']),
    qtdMarchas:                     n(s['qtd_marchas']),
    fhev:                           b(s['fhev']),
    phev:                           b(s['phev']),
    bev:                            b(s['bev']),
    motorDiesel:                    b(s['motor_diesel']),
    paddleShift:                    b(s['paddle_shift']),
    eShifter:                       b(s['e_shifter']),
    tecnologiaBiturbo:              b(s['tecnologia_biturbo']),
    motorEletrico:                  b(s['motor_eletrico']),
    eAutonomyKm:                    n(s['e_autonomy_km']),
    rodasLigaLeve:                  b(s['rodas_liga_leve']),
    rodasPolegadas:                 n(s['rodas_polegadas']),
    pneusAtr:                       b(s['pneus_atr']),
    pneusRunflat:                   b(s['pneus_runflat']),
    pneusAtrPlus:                   b(s['pneus_atr_plus']),
    pneusAutoVedantes:              b(s['pneus_auto_vedantes']),
    estepeFullSize:                 b(s['estepe_full_size']),
    estepeTemporario:               b(s['estepe_temporario']),
    lojaAplicativos:                b(s['loja_aplicativos']),
    assistenteDigital:              b(s['assistente_digital']),
    travaDestravaRemoto:            b(s['trava_destrava_remoto']),
    ignicaoRemota:                  b(s['ignicao_remota']),
    localizacaoVeiculo:             b(s['localizacao_veiculo']),
    vehicleHealthAlerts:            b(s['vehicle_health_alerts']),
    sendPoiNavigation:              b(s['send_poi_navigation']),
    geofencingGuardMode:            b(s['geofencing_guard_mode']),
    vehicleRecovery:                b(s['vehicle_recovery']),
    ubi:                            b(s['ubi']),
    wifiHotspot:                    b(s['wifi_hotspot']),
    atualizacaoOta:                 b(s['atualizacao_ota']),
    bluetooth:                      b(s['bluetooth']),
    cameraTraseira:                 b(s['camera_traseira']),
    camera180Graus:                 b(s['camera_180_graus']),
    navegadorGps:                   b(s['navegador_gps']),
    navegadorGpsAtualizavel:        b(s['navegador_gps_atualizavel']),
    comandoVoz:                     b(s['comando_voz']),
    altoFalantesQtd:                n(s['alto_falantes_qtd']),
    headUpDisplay:                  b(s['head_up_display']),
    sistemaSomPremium:              b(s['sistema_som_premium']),
    espelhamentoAndroidAppleCabo:   b(s['espelhamento_android_apple_cabo']),
    multimidiaPolegadas:            n(s['multimidia_polegadas']),
    assistenciaEmergencia:          b(s['assistencia_emergencia']),
    carregamentoWireless:           b(s['carregamento_wireless']),
    camera360:                      b(s['camera_360']),
    androidAppleWireless:           b(s['android_apple_wireless']),
    painelInstrumentoColoridoPol:   n(s['painel_instrumento_colorido_pol']),
    usbQtd:                         n(s['usb_qtd']),
    arCondSaida2aFileira:           b(s['ar_cond_saida_2a_fileira']),
    arCondAutomaticoDigital:        b(s['ar_cond_automatico_digital']),
    arCondDuasZonas:                b(s['ar_cond_duas_zonas']),
    controleAntiCapotamento:        b(s['controle_anti_capotamento']),
    freioAutomaticoParado:          b(s['freio_automatico_parado']),
    tpms:                           b(s['tpms']),
    controleDescida:                b(s['controle_descida']),
    controleAdaptativoCarga:        b(s['controle_adaptativo_carga']),
    controleReboque:                b(s['controle_reboque']),
    trailControl:                   b(s['trail_control']),
    freioAutomaticoAposImpacto:     b(s['freio_automatico_apos_impacto']),
    assistenciaDirecaoDefensiva:    b(s['assistencia_direcao_defensiva']),
    airbagsQtd:                     n(s['airbags_qtd']),
    pilotoAutomatico:               b(s['piloto_automatico']),
    limitadorVelocidade:            b(s['limitador_velocidade']),
    pilotoAutomaticoAdaptativo:     b(s['piloto_automatico_adaptativo']),
    sistemaPermanenciaFaixa:        b(s['sistema_permanencia_faixa']),
    sensorEstacTraseiro:            b(s['sensor_estac_traseiro']),
    sensorEstacDianteiro:           b(s['sensor_estac_dianteiro']),
    sensorChuva:                    b(s['sensor_chuva']),
    retroVisorEletrocromico:        b(s['retrovisor_eletrocromico']),
    sensorCrepuscular:              b(s['sensor_crepuscular']),
    detectorFadiga:                 b(s['detector_fadiga']),
    freioMaoEletronico:             b(s['freio_mao_eletronico']),
    retroVisorEletrico:             b(s['retrovisor_eletrico']),
    blis:                           b(s['blis']),
    reconhecimentoSinaisTransito:   b(s['reconhecimento_sinais_transito']),
    aeb:                            b(s['aeb']),
    retroVisorRebatimentoEletrico:  b(s['retrovisor_rebatimento_eletrico']),
    alertaColisaoFrontal:           b(s['alerta_colisao_frontal']),
    sistemaCentralizacaoFaixa:      b(s['sistema_centralizacao_faixa']),
    accStopAndGo:                   b(s['acc_stop_and_go']),
    blisAlertaTrafegoCruzado:       b(s['blis_alerta_trafego_cruzado']),
    reverseAeb:                     b(s['reverse_aeb']),
    keylessEntryPeps:               b(s['keyless_entry_peps']),
    alarmeVolumetrico:              b(s['alarme_volumetrico']),
    globalOpening:                  b(s['global_opening']),
    travaEletricaPortas:            b(s['trava_eletrica_portas']),
    vidroEletricoTraseiro:          b(s['vidro_eletrico_traseiro']),
    globalClosing:                  b(s['global_closing']),
    bancosCouro:                    b(s['bancos_couro']),
    manoplaCambioCouro:             b(s['manopla_cambio_couro']),
    volanteCouro:                   b(s['volante_couro']),
    painelSoftTouch:                b(s['painel_soft_touch']),
    tetoSolarEletrico:              b(s['teto_solar_eletrico']),
    tetoSolarPanoramico:            b(s['teto_solar_panoramico']),
    bancoTraseiroAquecido:          b(s['banco_traseiro_aquecido']),
    bancosAquecimentoFrontal:       b(s['bancos_aquecimento_frontal']),
    bancosRefrigeradosFrontal:      b(s['bancos_refrigerados_frontal']),
    bancoPosicoesEletrico:          n(s['banco_posicoes_eletrico']),
    faroisFullLed:                  b(s['farois_full_led']),
    drlSignature:                   b(s['drl_signature']),
    farolAltoAutomatico:            b(s['farol_alto_automatico']),
    lanternasLedParcial:            b(s['lanternas_led_parcial']),
    lanternasFullLed:               b(s['lanternas_full_led']),
    faroisNeblinaLed:               b(s['farois_neblina_led']),
    faroisMatrixLed:                b(s['farois_matrix_led']),
    iluminacaoCacamba:              b(s['iluminacao_cacamba']),
    tracao4x4HighLow:               b(s['tracao_4x4_high_low']),
    diferencialTraseiroBlocante:    b(s['diferencial_traseiro_bocante']),
    santoAntonio:                   b(s['santo_antonio']),
    estribuLateralPlataforma:       b(s['estribo_lateral_plataforma']),
    protetorCacamba:                b(s['protetor_cacamba']),
    terrainManagementSystem:        b(s['terrain_management_system']),
    tracaoAwd:                      b(s['tracao_awd']),
    suspensaoFoxLiveValve:          b(s['suspensao_fox_live_valve']),
    anosGarantia:                   n(s['anos_garantia']),
    apoioBracoTraseiro:             b(s['apoio_braco_traseiro']),
    cabineDupla:                    b(s['cabine_dupla']),
    degrauAcessoCacamba:            b(s['degrau_acesso_cacamba']),
    assistenteTampaCacamba:         b(s['assistente_tampa_cacamba']),
    travamentoEletricoCacamba:      b(s['travamento_eletrico_cacamba']),
    engateReboque3500kg:            b(s['engate_reboque_3500kg']),
    bussolaInclinometro:            b(s['bussola_inclinometro']),
    consoleApoioBracoDianteiro:     b(s['console_apoio_braco_dianteiro']),
    discoFreioTraseiro:             b(s['disco_freio_traseiro']),
    ganchosReboqueQtd:              n(s['ganchos_reboque_qtd']),
    protetorCarter:                 b(s['protetor_carter']),
    protetorTanque:                 b(s['protetor_tanque']),
    tapeteBorracha:                 b(s['tapete_borracha']),
    iluminacaoAmbiente:             b(s['iluminacao_ambiente']),
    tomada12v:                      b(s['tomada_12v']),
    bagageiroTetoLong:              b(s['bagageiro_teto_long']),
  }
}

export async function vehicleRoutes(app: FastifyInstance) {
  const vehicleRepo = AppDataSource.getRepository(Vehicle)
  const specRepo = AppDataSource.getRepository(VehicleSpec)

  app.get('/vehicles', {
    preHandler: [authenticate]
  }, async (req: AuthenticatedRequest, reply) => {
    await logAudit('list_vehicles', req, 'success')
    return vehicleRepo.find({ relations: ['spec', 'segment'] })
  })

  app.get('/vehicles/:id', {
    preHandler: [authenticate]
  }, async (req: AuthenticatedRequest, reply) => {
    const { id } = req.params as { id: string }

    const vehicle = await vehicleRepo.findOne({
      where: { id },
      relations: ['spec', 'segment']
    })

    if (!vehicle) {
      await logAudit('get_vehicle', req, 'error', { id }, 'Veículo não encontrado')
      return reply.status(404).send({ error: 'Veículo não encontrado' })
    }

    await logAudit('get_vehicle', req, 'success', { id })
    return vehicle
  })

  app.post('/vehicles', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: {
        type: 'object',
        required: ['brand', 'model', 'version'],
        properties: {
          brand:        { type: 'string', minLength: 1, maxLength: 100 },
          model:        { type: 'string', minLength: 1, maxLength: 100 },
          version:      { type: 'string', minLength: 1, maxLength: 100 },
          yearModel:    { type: 'integer', minimum: 1990, maximum: 2030 },
          yearModelEnd: { type: 'integer', minimum: 1990, maximum: 2030 },
          isMidyear:    { type: 'boolean' }
        },
        additionalProperties: false
      }
    }
  }, async (req: AuthenticatedRequest, reply) => {
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

    await logAudit('create_vehicle', req, 'success', { brand, model, version, yearModel })
    return reply.status(201).send(vehicle)
  })

  app.post('/extract', {
    preHandler: [authenticate, requireRole('admin')],
    schema: {
      body: {
        type: 'object',
        required: ['brand', 'model', 'version', 'yearModel'],
        properties: {
          brand:        { type: 'string', minLength: 1, maxLength: 100 },
          model:        { type: 'string', minLength: 1, maxLength: 100 },
          version:      { type: 'string', minLength: 1, maxLength: 100 },
          yearModel:    { type: 'integer', minimum: 1990, maximum: 2030 },
          yearModelEnd: { type: 'integer', minimum: 1990, maximum: 2030 },
          isMidyear:    { type: 'boolean' }
        },
        additionalProperties: false
      }
    }
  }, async (req: AuthenticatedRequest, reply) => {
    const { brand, model, version, yearModel, yearModelEnd, isMidyear } = req.body as {
      brand: string
      model: string
      version: string
      yearModel: number
      yearModelEnd?: number
      isMidyear?: boolean
    }

    const pdfPath = findPdfPath(brand, model, version)
    const source = pdfPath ? 'pdf_extracted' : 'ia_generated'

    try {
      const specs = pdfPath
        ? await extractVehicleSpecsFromPdf(pdfPath, brand, model, version, yearModel)
        : await extractVehicleSpecs(brand, model, version, yearModel)

      const vehicle = vehicleRepo.create({
        brand, model, version, yearModel, yearModelEnd,
        isMidyear: isMidyear ?? false
      })
      await vehicleRepo.save(vehicle)

      const spec = specRepo.create({
        vehicle, source, status: 'active',
        ...mapSpecsToEntity(specs)
      })
      await specRepo.save(spec)

      await logAudit('extract', req, 'success', { brand, model, version, yearModel, source })
      return reply.status(201).send({ vehicle, spec, source })

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido'
      await logAudit('extract', req, 'error', { brand, model, version, yearModel }, msg)
      return reply.status(500).send({ error: 'Falha na extração', message: msg })
    }
  })
}