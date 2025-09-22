// cars.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('cars')
export class Cars {
  @ApiProperty({
    description: 'The unique identifier for the car',
    example: 1,
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The name of the car',
    example: 'Toyota Corolla',
  })
  @Column({ type: 'varchar', length: 255 })
  car_name: string;

  @ApiProperty({
    description: 'The image of the car',
    example: 'Toyota Corolla',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  car_image: string;

  @ApiProperty({
    description: 'The color of the car',
    example: 'Red',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  car_color: string;

  @ApiProperty({
    description: 'The police number of the car',
    example: 'AB1234KAE',
  })
  @Column({ type: 'varchar', length: 255, nullable: true })
  police_number: string;

  @ApiProperty({
    description: 'The transmission of the car',
    example: 'AUTO',
  })
  @Column({ type: 'enum', enum: ['AUTO', 'MANUAL'] })
  transmission: 'AUTO' | 'MANUAL';

  @ApiProperty({
    description: 'The year the car was manufactured',
    example: 'Cars manufactured in 2020',
  })
  @Column({ type: 'varchar', length: 1000, nullable: true })
  description: string;

  @ApiProperty({
    description: 'Maximum number of people',
    example: 4,
  })
  @Column({ type: 'int' })
  max_persons: number;

  @ApiProperty({
    description: 'The price of the car in USD',
    example: 1500,
  })
  @Column({ type: 'int' })
  price_per_day: number;

  @ApiProperty({
    description: 'The transmission of the car',
    example: '[{Automatic}, {Manual}]',
  })
  @Column({ type: 'json', nullable: true })
  includes: string[];

  @ApiProperty({
    description: 'The timestamp when the car was created',
    example: '2024-11-18T12:00:00.000Z',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: 'The timestamp when the car was last updated',
    example: '2024-11-19T12:00:00.000Z',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({
    description: 'The timestamp when the car was soft-deleted',
    example: '2024-11-20T12:00:00.000Z',
    nullable: true,
  })
  @DeleteDateColumn()
  deleted_at: Date;
}
