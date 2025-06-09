import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity('cars')
export class Cars {
  @ApiProperty({
    description: 'The unique identifier for the car',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @PrimaryGeneratedColumn('uuid')
  id: string;

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
    description: 'The year the car was manufactured',
    example: 'Cars manufactured in 2020',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'Minimum number of people',
    example: 1,
  })
  @Column({ type: 'int' })
  min_person: number;

  @ApiProperty({
    description: 'Maximum number of people',
    example: 4,
  })
  @Column({ type: 'int' })
  max_person: number;

  @ApiProperty({
    description: 'The price of the car in USD',
    example: 1500,
  })
  @Column({ type: 'int' })
  price: number;

  @ApiProperty({
    description: 'The transmission of the car',
    example: '[{Automatic}, {Manual}]',
  })
  @Column({ type: 'json', nullable: true })
  includes: string[];

  @ApiProperty({
    description: 'Status of the tour package (active/inactive)',
    example: true,
  })
  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ApiProperty({
    description: 'The timestamp when the tour package was created',
    example: '2024-11-18T12:00:00.000Z',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: 'The timestamp when the tour package was last updated',
    example: '2024-11-19T12:00:00.000Z',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({
    description: 'The timestamp when the tour package was soft-deleted',
    example: '2024-11-20T12:00:00.000Z',
    nullable: true,
  })
  @DeleteDateColumn()
  deleted_at: Date;
}
