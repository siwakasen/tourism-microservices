import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Bookings } from "./bookings.entity";

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

export enum PaymentMethod {
  MIDTRANS = 'MIDTRANS',
  PAYPAL = 'PAYPAL',
}

@Entity('payments')
class Payment extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @ManyToOne(() => Bookings, (booking) => booking.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn({ name: 'booking_id' })
  public booking!: Bookings;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  public modification_id: number;

  @ApiProperty()
  @Column({ type: 'float', nullable: false })
  public gross_amount!: number;

  @ApiProperty()
  @Column({ type: 'float', nullable: true })
  public net_amount!: number;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  public payment_date!: Date;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: false })
  public payment_method!: PaymentMethod;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  public payment_gateway_id!: string;

  @ApiProperty({ enum: PaymentStatus })
  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING
  })
  public status: PaymentStatus;

  @ApiProperty()
  @CreateDateColumn()
  public created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  public updated_at: Date;
}

export { Payment };
