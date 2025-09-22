// travel-packages.entity.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('travel_packages')
export class TravelPackages {
  @ApiProperty({
    description: 'The unique identifier for the travel package',
    example: '1',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The name of the travel package',
    example: 'Bali Island Adventure',
  })
  @Column({ type: 'varchar', length: 255 })
  package_name: string;

  @ApiProperty({
    description: 'The detailed description of the travel package',
    example: 'Experience the beauty of Bali with a 3-day adventure package.',
  })
  @Column({ type: 'varchar', length: 1000, nullable: true })
  description: string;

  @ApiProperty({
    description: 'List of image URLs for the travel package',
    example:
      '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
  })
  @Column({ type: 'json', nullable: true })
  images: string[];

  @ApiProperty({
    description: 'The price of the travel package in USD',
    example: 1500,
  })
  @Column({ type: 'int' })
  package_price: number;

  @ApiProperty({
    description: 'The duration of the travel package in hours',
  })
  @Column({ type: 'int' })
  duration: number;

  @ApiProperty({
    description: 'The maximum group size for the travel package',
    example: 10,
  })
  @Column({ type: 'int' })
  max_persons: number;

  @ApiProperty({
    description: 'The detailed itineraries for the travel package in hours',
  })
  @Column({ type: 'json', nullable: true })
  itineraries: string[];

  @ApiProperty({
    description: 'The list of items included in the travel package',
    example: '["Hotel", "Meals", "Guided Tours"]',
  })
  @Column({ type: 'json', nullable: true })
  includes: string[];

  @ApiProperty({
    description: 'The timestamp when the travel package was created',
    example: '2024-11-18T12:00:00.000Z',
  })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({
    description: 'The timestamp when the travel package was last updated',
    example: '2024-11-19T12:00:00.000Z',
  })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiProperty({
    description: 'The timestamp when the travel package was soft-deleted',
    example: '2024-11-20T12:00:00.000Z',
    nullable: true,
  })
  @DeleteDateColumn()
  deleted_at: Date;
}
