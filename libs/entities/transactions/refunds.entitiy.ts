import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

export enum RefundStatus {
  WAITING_FORM = 'WAITING_FORM',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED'
}

@Entity('refunds')
class Refunds extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public booking_id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public amount!: number;

  @ApiProperty({ enum: RefundStatus })
  @Column({
    type: 'enum',
    enum: RefundStatus,
    default: RefundStatus.WAITING_FORM
  })
  public status: RefundStatus;

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
