import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

@Entity('payments')
class Payment extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public booking_id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: true })
  public modification_id: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public amount!: number;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: false })
  public payment_date!: Date;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: false })
  public payment_method!: string;

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
