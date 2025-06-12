import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { BaseEntity, Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export @Entity('customers')
 class Customer extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: false })
  public name: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  public phone_number?: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  public country_origin?: string;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: false, unique: true })
  public email: string;

  @ApiProperty()
  @Exclude()
  @Column({ type: 'varchar', nullable: false })
  public password: string;

  @ApiProperty()
  @CreateDateColumn()
  public created_at!: Date;

  @ApiProperty()
  @UpdateDateColumn()
  public updated_at!: Date;

  @ApiProperty()
  @DeleteDateColumn()
  public deleted_at?: Date;
}
