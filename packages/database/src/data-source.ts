import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { Segment } from './Segment'
import { Vehicle } from './Vehicle'
import { VehicleSpec } from './VehicleSpec'

export const AppDataSource = new DataSource({
  type: 'oracle',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 1521,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  serviceName: process.env.DB_SERVICE,
  synchronize: true,
  logging: true,
  entities: [Segment, Vehicle, VehicleSpec],
})