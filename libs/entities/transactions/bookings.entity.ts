import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { Payment } from './payment.entity';
import { BookingAdjustments } from './booking_adjustments.entity';
import { Refunds } from './refunds.entitiy';

export enum BookingStatus {
  WAITING_PAYMENT = 'WAITING_PAYMENT',
  WAITING_CONFIRMATION = 'WAITING_CONFIRMATION',
  CONFIRMED = 'CONFIRMED',
  ONGOING = 'ONGOING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
}

@Entity('bookings')
class Bookings extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  public package_id: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  public car_id: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public customer_id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  public employee_id: number;

  @ApiProperty()
  @Column({ type: 'boolean', default: false })
  public with_driver: boolean;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  public number_of_persons: number;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: false })
  public start_date: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: false })
  public end_date: Date;

  @ApiProperty()
  @Column({ type: 'float', nullable: true })
  public total_price: number;

  @ApiProperty({ enum: BookingStatus })
  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.WAITING_PAYMENT,
  })
  public status: BookingStatus;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  public pickup_location: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  public pickup_time: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  public additional_notes: string;

  @ApiProperty()
  @CreateDateColumn()
  public created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  public updated_at: Date;

  @OneToMany(() => Payment, (payment) => payment.booking)
  public payments: Payment[];

  @OneToMany(
    () => BookingAdjustments,
    (booking_adjustment) => booking_adjustment.booking,
  )
  public booking_adjustments: BookingAdjustments[];

  @OneToOne(() => Refunds, (refund) => refund.booking)
  public refunds: Refunds;
}

export { Bookings };
