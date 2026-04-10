import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm'
import { Vehicle } from './Vehicle'

@Entity('vehicle_specs')
export class VehicleSpec {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @OneToOne(() => Vehicle, vehicle => vehicle.spec)
  @JoinColumn({ name: 'vehicle_id' })
  vehicle!: Vehicle

  @Column({ name: 'engine_name', type: 'varchar2', length: 100, nullable: true })
  engineName!: string

  @Column({ name: 'displacement_cc', type: 'number', nullable: true })
  displacementCc!: number

  @Column({ name: 'power_cv', type: 'number', nullable: true })
  powerCv!: number

  @Column({ name: 'torque_nm', type: 'number', nullable: true })
  torqueNm!: number

  @Column({ name: 'fuel_type', type: 'varchar2', length: 50, nullable: true })
  fuelType!: string

  @Column({ type: 'number', nullable: true })
  cylinders!: number

  @Column({ type: 'varchar2', length: 100, nullable: true })
  gearbox!: string

  @Column({ type: 'varchar2', length: 10, nullable: true })
  drive!: string

  @Column({ name: 'four_low', type: 'number', width: 1, nullable: true })
  fourLow!: boolean

  @Column({ name: 'payload_kg', type: 'number', nullable: true })
  payloadKg!: number

  @Column({ name: 'towing_kg', type: 'number', nullable: true })
  towingKg!: number

  @Column({ name: 'fuel_tank_l', type: 'number', nullable: true })
  fuelTankL!: number

  @Column({ name: 'length_mm', type: 'number', nullable: true })
  lengthMm!: number

  @Column({ name: 'width_mm', type: 'number', nullable: true })
  widthMm!: number

  @Column({ name: 'height_mm', type: 'number', nullable: true })
  heightMm!: number

  @Column({ name: 'wheelbase_mm', type: 'number', nullable: true })
  wheelbaseMm!: number

  @Column({ name: 'ground_clearance_mm', type: 'number', nullable: true })
  groundClearanceMm!: number

  @Column({ name: 'bed_length_mm', type: 'number', nullable: true })
  bedLengthMm!: number

  @Column({ name: 'front_suspension', type: 'varchar2', length: 100, nullable: true })
  frontSuspension!: string

  @Column({ name: 'rear_suspension', type: 'varchar2', length: 100, nullable: true })
  rearSuspension!: string

  @Column({ name: 'front_brakes', type: 'varchar2', length: 100, nullable: true })
  frontBrakes!: string

  @Column({ name: 'rear_brakes', type: 'varchar2', length: 100, nullable: true })
  rearBrakes!: string

  @Column({ type: 'number', nullable: true })
  airbags!: number

  @Column({ name: 'has_abs', type: 'number', width: 1, nullable: true })
  hasAbs!: boolean

  @Column({ name: 'has_esc', type: 'number', width: 1, nullable: true })
  hasEsc!: boolean

  @Column({ name: 'has_cruise', type: 'number', width: 1, nullable: true })
  hasCruise!: boolean

  @Column({ name: 'has_adaptive_cruise', type: 'number', width: 1, nullable: true })
  hasAdaptiveCruise!: boolean

  @Column({ name: 'infotainment_inch', type: 'number', precision: 4, scale: 1, nullable: true })
  infotainmentInch!: number

  @Column({ name: 'has_wireless_charge', type: 'number', width: 1, nullable: true })
  hasWirelessCharge!: boolean

  @Column({ name: 'camera_system', type: 'varchar2', length: 50, nullable: true })
  cameraSystem!: string

  @Column({ name: 'base_price_brl', type: 'number', precision: 12, scale: 2, nullable: true })
  basePriceBrl!: number

  @Column({ type: 'clob', nullable: true })
  extras!: Record<string, unknown>

  @Column({ name: 'source_url', type: 'varchar2', length: 500, nullable: true })
  sourceUrl!: string

  @Column({ name: 'fetched_at', type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  fetchedAt!: Date
}