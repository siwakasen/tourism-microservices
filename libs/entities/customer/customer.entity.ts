import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('customers')
class Customer extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

@ApiProperty()
  @Column({ type: 'text', nullable: false })
  public name: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  public phone_number?: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: true })
  public country_origin?: string;

  @ApiProperty()
  @Column({ type: 'text', nullable: false, unique: true })
  public email: string;

  @ApiProperty()
  @Exclude()
  @Column({ type: 'text', nullable: false })
  public password: string;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  public created_at!: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: false, default: () => 'CURRENT_TIMESTAMP' })
  public updated_at!: Date;

  @ApiProperty()
  @Column({ type: 'timestamp', nullable: true })
  public deleted_at?: Date;
}

export { Customer };
