import { ApiProperty } from "@nestjs/swagger";
import { BaseEntity, Column, Entity, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity('ratings')
class Ratings extends BaseEntity {
  @ApiProperty()
  @PrimaryGeneratedColumn()
  public id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public bookings_id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public customer_id!: number;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public service_rate!: number;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  public desc_service: string;

  @ApiProperty()
  @Column({ type: 'int', nullable: false })
  public employee_rate!: number;

  @ApiProperty()
  @Column({ type: 'varchar', nullable: true })
  public desc_employee: string;

  @ApiProperty()
  @CreateDateColumn()
  public created_at: Date;

  @ApiProperty()
  @UpdateDateColumn()
  public updated_at: Date;
}

export { Ratings };
