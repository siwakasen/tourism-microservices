import { ApiProperty } from '@nestjs/swagger';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Bookings } from './bookings.entity';

@Entity('ratings')
class Ratings extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @OneToOne(() => Bookings, (booking) => booking.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn({ name: 'booking_id' })
  public booking!: Bookings;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public customer_id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public service_rate!: number;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  public description: string;

  @ApiProperty()
  @CreateDateColumn()
  public created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  public updated_at: Date;
}

export { Ratings };
