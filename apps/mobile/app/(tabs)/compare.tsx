import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator
} from 'react-native'
import { ChevronDown, Check } from 'lucide-react-native'
import api from '@/services/api'

interface Vehicle {
  id: string
  brand: string
  model: string
  version: string
  yearModel: number
  spec: Record<string, any> | null
}

const COMPARE_FIELDS = [
  { key: 'potenciaCv', label: 'Potência (cv)', unit: 'cv' },
  { key: 'torqueNm', label: 'Torque (Nm)', unit: 'Nm' },
  { key: 'qtdMarchas', label: 'Marchas', unit: '' },
  { key: 'airbagsQtd', label: 'Airbags', unit: '' },
  { key: 'multimidiaPolegadas', label: 'Multimídia', unit: '"' },
  { key: 'rodasPolegadas', label: 'Rodas', unit: '"' },
  { key: 'anosGarantia', label: 'Garantia', unit: 'anos' },
]

const BOOL_FIELDS = [
  { key: 'motorDiesel', label: 'Motor Diesel' },
  { key: 'tecnologiaBiturbo', label: 'Biturbo' },
  { key: 'tracao4x4HighLow', label: 'Tração 4x4' },
  { key: 'pilotoAutomaticoAdaptativo', label: 'ACC Adaptativo' },
  { key: 'camera360', label: 'Câmera 360°' },
  { key: 'carregamentoWireless', label: 'Carregamento Sem Fio' },
  { key: 'suspensaoFoxLiveValve', label: 'Suspensão FOX' },
  { key: 'faroisMatrixLed', label: 'Faróis Matrix LED' },
]

export default function CompareScreen() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [vehicleA, setVehicleA] = useState<Vehicle | null>(null)
  const [vehicleB, setVehicleB] = useState<Vehicle | null>(null)
  const [picking, setPicking] = useState<'A' | 'B' | null>(null)

  useEffect(() => {
    api.get('/vehicles')
      .then(res => setVehicles(res.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function selectVehicle(v: Vehicle) {
    if (picking === 'A') setVehicleA(v)
    else if (picking === 'B') setVehicleB(v)
    setPicking(null)
  }

  function getBetter(key: string): 'A' | 'B' | null {
    const a = vehicleA?.spec?.[key]
    const b = vehicleB?.spec?.[key]
    if (!a || !b) return null
    return a > b ? 'A' : b > a ? 'B' : null
  }

  if (picking) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => setPicking(null)} style={styles.backBtn}>
            <Text style={styles.backText}>← Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Escolha o veículo {picking}</Text>
          <ScrollView>
            {vehicles.map(v => (
              <TouchableOpacity
                key={v.id}
                style={styles.pickCard}
                onPress={() => selectVehicle(v)}>
                <Text style={styles.pickName}>{v.brand} {v.model} {v.version}</Text>
                <Text style={styles.pickSub}>{v.yearModel}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Comparativo</Text>

      <View style={styles.selectors}>
        <TouchableOpacity
          style={[styles.selectorBtn, { borderColor: '#3b82f6' }]}
          onPress={() => setPicking('A')}>
          <Text style={styles.selectorLabel}>Veículo A</Text>
          <Text style={styles.selectorValue} numberOfLines={1}>
            {vehicleA ? `${vehicleA.brand} ${vehicleA.model}` : 'Selecionar'}
          </Text>
          <ChevronDown color="#6b7280" size={14} />
        </TouchableOpacity>

        <View style={styles.vsContainer}>
          <Text style={styles.vs}>VS</Text>
        </View>

        <TouchableOpacity
          style={[styles.selectorBtn, { borderColor: '#8b5cf6' }]}
          onPress={() => setPicking('B')}>
          <Text style={styles.selectorLabel}>Veículo B</Text>
          <Text style={styles.selectorValue} numberOfLines={1}>
            {vehicleB ? `${vehicleB.brand} ${vehicleB.model}` : 'Selecionar'}
          </Text>
          <ChevronDown color="#6b7280" size={14} />
        </TouchableOpacity>
      </View>

      {loading && <ActivityIndicator color="#3b82f6" style={{ marginTop: 40 }} />}

      {vehicleA && vehicleB && (
        <>
          <Text style={styles.sectionTitle}>Especificações numéricas</Text>
          <View style={styles.table}>
            {COMPARE_FIELDS.map(field => {
              const aVal = vehicleA.spec?.[field.key]
              const bVal = vehicleB.spec?.[field.key]
              const better = getBetter(field.key)
              return (
                <View key={field.key} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellA,
                    better === 'A' && styles.winner]}>
                    {aVal != null ? `${aVal}${field.unit}` : '—'}
                  </Text>
                  <Text style={styles.tableLabel}>{field.label}</Text>
                  <Text style={[styles.tableCell, styles.tableCellB,
                    better === 'B' && styles.winner]}>
                    {bVal != null ? `${bVal}${field.unit}` : '—'}
                  </Text>
                </View>
              )
            })}
          </View>

          <Text style={styles.sectionTitle}>Equipamentos</Text>
          <View style={styles.table}>
            {BOOL_FIELDS.map(field => {
              const aVal = vehicleA.spec?.[field.key]
              const bVal = vehicleB.spec?.[field.key]
              return (
                <View key={field.key} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.tableCellA]}>
                    {aVal === 1
                      ? <Check color="#10b981" size={18} />
                      : <Text style={styles.cross}>✗</Text>
                    }
                  </View>
                  <Text style={styles.tableLabel}>{field.label}</Text>
                  <View style={[styles.tableCell, styles.tableCellB]}>
                    {bVal === 1
                      ? <Check color="#10b981" size={18} />
                      : <Text style={styles.cross}>✗</Text>
                    }
                  </View>
                </View>
              )
            })}
          </View>
        </>
      )}

      {!vehicleA && !vehicleB && !loading && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚖️</Text>
          <Text style={styles.emptyTitle}>Compare dois veículos</Text>
          <Text style={styles.emptySub}>
            Selecione dois veículos acima para ver o comparativo lado a lado
          </Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0f1e' },
  content: { padding: 20, paddingTop: 60 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 20 },
  selectors: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 28 },
  selectorBtn: {
    flex: 1, backgroundColor: '#111827', borderRadius: 12,
    padding: 12, borderWidth: 1.5
  },
  selectorLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  selectorValue: { fontSize: 13, color: '#f5f5f5', fontWeight: '600', marginBottom: 4 },
  vsContainer: { alignItems: 'center' },
  vs: { fontSize: 14, fontWeight: 'bold', color: '#4b5563' },
  sectionTitle: {
    fontSize: 12, fontWeight: '700', color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10, marginTop: 20
  },
  table: {
    backgroundColor: '#111827', borderRadius: 14,
    borderWidth: 1, borderColor: '#1f2937', overflow: 'hidden'
  },
  tableRow: {
    flexDirection: 'row', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#1f2937', paddingVertical: 12
  },
  tableCell: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tableCellA: { alignItems: 'center' },
  tableCellB: { alignItems: 'center' },
  tableLabel: {
    flex: 1.5, textAlign: 'center', fontSize: 12,
    color: '#6b7280', fontWeight: '500'
  },
  winner: {},
  cross: { fontSize: 16, color: '#ef4444' },
  backBtn: { marginBottom: 20 },
  backText: { color: '#3b82f6', fontSize: 16, fontWeight: '600' },
  pickCard: {
    backgroundColor: '#111827', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#1f2937', marginBottom: 10
  },
  pickName: { fontSize: 14, fontWeight: '600', color: '#f5f5f5' },
  pickSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  emptyState: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#f5f5f5', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 }
})