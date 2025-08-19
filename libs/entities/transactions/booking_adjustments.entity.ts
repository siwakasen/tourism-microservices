import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne } from "typeorm";
import { Bookings } from "./bookings.entity";

export enum RequestType {
  CANCELLATION = 'CANCELLATION',
  RESCHEDULE = 'RESCHEDULE'
}

export enum AdjustmentStatus {
  PENDING = 'PENDING',
  WAITING_PAYMENT = 'WAITING_PAYMENT',
  WAITING_REASSIGNMENT = 'WAITING_REASSIGNMENT',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

@Entity('booking_adjustments')
class BookingAdjustments extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @ManyToOne(() => Bookings, (booking) => booking.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn({ name: 'booking_id' })
  public booking: Bookings;

  @ApiProperty({ enum: RequestType })
  @Column({
    type: 'enum',
    enum: RequestType,
    nullable: false
  })
  public request_type!: RequestType;

  @ApiProperty({ enum: AdjustmentStatus })
  @Column({
    type: 'enum',
    enum: AdjustmentStatus,
    default: AdjustmentStatus.PENDING
  })
  public status: AdjustmentStatus;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  public reason: string;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  public new_start_date: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  public new_end_date: Date;

  @ApiProperty()
  @Column({ type: 'float', nullable: true })
  public additional_price: number;

  @ApiProperty()
  @CreateDateColumn()
  public created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  public updated_at: Date;
}

export { BookingAdjustments };
