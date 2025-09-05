import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, JoinColumn, ManyToOne, OneToOne } from "typeorm";
import { Bookings } from "./bookings.entity";

export enum RefundStatus {
  WAITING_FORM = 'WAITING_FORM',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum RefundMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  PAYPAL = 'PAYPAL',
}

@Entity('refunds')
class Refunds extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @OneToOne(() => Bookings, (booking) => booking.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn({ name: 'booking_id' })
  public booking!: Bookings;

  @ApiProperty()
  @Column({ type: 'float', nullable: false })
  public amount: number;

  @ApiProperty()
  @Column({
    type: 'enum',
    enum: RefundMethod,
    default: RefundMethod.BANK_TRANSFER,
    nullable: true
  })
  public method?: RefundMethod;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  public bank_name?: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  public account_number?: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  public account_name?: string;

  @ApiProperty({ enum: RefundStatus })
  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.WAITING_FORM
  })
  public status: RefundStatus;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  public refund_date?: Date;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  public reason: string;

  @ApiProperty()
  @CreateDateColumn()
  public created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  public updated_at: Date;
}

export { Refunds };
