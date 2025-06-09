import { ApiProperty } from '@nestjs/swagger';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Unique,
} from 'typeorm';

@Entity('travel_packages')
export class TravelPackages {
  @ApiProperty({
    description: 'The unique identifier for the tour package',
    example: '1',
  })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({
    description: 'The name of the tour package',
    example: 'Bali Island Adventure',
  })
  @Column({ type: 'varchar', length: 255 })
  @Unique('UQ_PACKAGE_NAME', ['package_name'])
  package_name: string;

  @ApiProperty({
    description: 'The detailed description of the tour package',
    example: 'Experience the beauty of Bali with a 3-day adventure package.',
  })
  @Column({ type: 'text', nullable: true })
  description: string;

  @ApiProperty({
    description: 'List of image URLs for the tour package',
    example:
      '["https://example.com/image1.jpg", "https://example.com/image2.jpg"]',
  })
  @Column({ type: 'json', nullable: true })
  images: string[];

  @ApiProperty({
    description: 'The price of the tour package in USD',
    example: 1500,
  })
  @Column({ type: 'int' })
  package_price: number;

  @ApiProperty({
    description: 'The duration of the tour package in days',
    example: 3,
  })
  @Column({ type: 'int' })
  duration: number;

  @ApiProperty({
    description: 'The maximum group size for the tour package',
    example: 10,
  })
  @Column({ type: 'int' })
  max_group_size: number;

  @ApiProperty({
    description: 'The discounted price for children (if applicable)',
    example: 500,
    nullable: true,
  })
  @Column({ type: 'int', nullable: true })
  children_price: number;

  @ApiProperty({
    description: 'The detailed itineraries for the tour package',
    example:
      '[{"day": 1, "activity": "Visit Ubud Forest"}, {"day": 2, "activity": "Relax at Kuta Beach"}]',
  })
  @Column({ type: 'json', nullable: true })
  itineraries: string[];

  @ApiProperty({
    description: 'The list of items included in the tour package',
    example: '["Hotel", "Meals", "Guided Tours"]',
  })
  @Column({ type: 'json', nullable: true })
  includes: string[];

  @ApiProperty({
    description: 'The areas where pickup is available',
    example: '["Denpasar", "Ubud", "Kuta"]',
  })
  @Column({ type: 'json', nullable: true })
  pickup_areas: string[];

  @ApiProperty({
    description: 'Terms and conditions for the tour package',
    example:
      '{"cancellation_policy": "Non-refundable", "payment": "Full payment required"}',
  })
  @Column({ type: 'json', nullable: true })
  terms_conditions: string[];

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
